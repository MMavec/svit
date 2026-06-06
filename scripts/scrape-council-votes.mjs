#!/usr/bin/env node
// Scrapes per-councillor recorded votes from City of Victoria council minutes (eSCRIBE) and writes
// src/lib/data/council-votes.json. Run locally or from the scrape-council-votes GitHub Action.
//
// Pipeline (all verified against live eSCRIBE):
//   1. POST GetCalendarMeetings (calendarStartDate/EndDate) -> meetings + MeetingDocumentLink[]
//   2. minutes PDF = the doc with Type=="PostMinutes" & Format==".pdf" (appears AFTER adoption,
//      so the scorecard trails live council by ~2-4 weeks)
//   3. pdftotext -layout on each new PDF -> text
//   4. parse the OPPOSED-only vote convention: "OPPOSED (N): names..." + "CARRIED/DEFEATED (a to b)"
//      / "CARRIED UNANIMOUSLY". in-favour = PRESENT - OPPOSED - CONFLICT.
//
// Requires: poppler-utils (`pdftotext`). Node 18+ (global fetch).

import { execFileSync } from 'node:child_process';
import { mkdtempSync, writeFileSync, readFileSync, rmSync, mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const BASE = 'https://pub-victoria.escribemeetings.com';
const OUT = join(
	dirname(fileURLToPath(import.meta.url)),
	'..',
	'src',
	'lib',
	'data',
	'council-votes.json'
);
const MONTHS_BACK = Number(process.env.VOTE_MONTHS_BACK || 8);
const UA = 'SVIT civic dashboard (council vote scorecard)';

// Current Victoria council, 2022-2026 term. Surnames as they appear in minutes.
const COUNCILLORS = [
	'Alto',
	'Caradonna',
	'Coleman',
	'Dell',
	'Gardiner',
	'Hammond',
	'Kim',
	'Loughton',
	'Thompson'
];

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function ymd(d) {
	return d.toISOString().slice(0, 10);
}

async function getMeetings() {
	const end = new Date();
	const start = new Date();
	start.setMonth(start.getMonth() - MONTHS_BACK);
	const res = await fetch(`${BASE}/MeetingsCalendarView.aspx/GetCalendarMeetings`, {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', 'User-Agent': UA },
		body: JSON.stringify({ calendarStartDate: ymd(start), calendarEndDate: ymd(end) })
	});
	if (!res.ok) throw new Error(`GetCalendarMeetings ${res.status}`);
	const data = await res.json();
	const list = Array.isArray(data?.d) ? data.d : [];
	// Only decision-making bodies, and only meetings with adopted minutes.
	return list
		.filter((m) => /council|committee of the whole/i.test(String(m.MeetingName || '')))
		.map((m) => {
			const docs = Array.isArray(m.MeetingDocumentLink) ? m.MeetingDocumentLink : [];
			const minutes = docs.find(
				(d) => d.Type === 'PostMinutes' && String(d.Format || '').toLowerCase() === '.pdf'
			);
			const idMatch = minutes && /DocumentId=(\d+)/.exec(String(minutes.Url || ''));
			return {
				id: String(m.ID || ''),
				name: String(m.MeetingName || 'Meeting'),
				date: String(m.StartDate || '').slice(0, 10),
				documentId: idMatch ? idMatch[1] : null
			};
		})
		.filter((m) => m.documentId);
}

async function pdfText(documentId, dir) {
	const res = await fetch(`${BASE}/FileStream.ashx?DocumentId=${documentId}`, {
		headers: { 'User-Agent': UA }
	});
	if (!res.ok) throw new Error(`FileStream ${documentId} ${res.status}`);
	const buf = Buffer.from(await res.arrayBuffer());
	if (buf.length < 1000) throw new Error(`PDF ${documentId} too small`);
	const pdf = join(dir, `${documentId}.pdf`);
	const txt = join(dir, `${documentId}.txt`);
	writeFileSync(pdf, buf);
	execFileSync('pdftotext', ['-layout', pdf, txt]);
	return readFileSync(txt, 'utf8');
}

const STRIP_PREFIX = /^(?:Acting\s+)?(?:Mayor|Councillor)\s+/i;

/** Parse a wrapped "LABEL (n): name, name, ..." block starting at `from` in `text`. */
function parseNameBlock(text, label, from, to) {
	const re = new RegExp(
		`${label}\\s*\\((\\d+)\\)\\s*:\\s*([\\s\\S]*?)(?=\\n\\s*\\n|\\n\\s*(?:OPPOSED|IN FAVOUR|CONFLICT|ABSENT|CARRIED|DEFEATED|On the|MOVED))`,
		'i'
	);
	const slice = text.slice(from, to);
	const m = re.exec(slice);
	if (!m) return null;
	const names = m[2]
		.replace(/\s+/g, ' ')
		.split(',')
		.map((s) => s.trim().replace(STRIP_PREFIX, '').trim())
		.filter(Boolean)
		// keep only recognised councillor surnames (first token match)
		.map((s) => COUNCILLORS.find((c) => s.toLowerCase().startsWith(c.toLowerCase())) || null)
		.filter(Boolean);
	return { declared: Number(m[1]), names: [...new Set(names)] };
}

/** Parse the meeting's PRESENT roster (council members in attendance). */
function parsePresent(text) {
	const m =
		/PRESENT\s*:?\s*([\s\S]{0,400}?)(?=\n\s*\n|ABSENT|STAFF|REGRETS|Minutes|CALL TO ORDER)/i.exec(
			text
		);
	if (!m) return [...COUNCILLORS];
	const found = COUNCILLORS.filter((c) => new RegExp(`\\b${c}\\b`, 'i').test(m[1]));
	return found.length >= 3 ? found : [...COUNCILLORS];
}

const ITEM_RE = /(?:^|\n)\s*([A-Z]\.\d+)\s+(.{6,90})/g;

function nearestItem(text, idx) {
	let best = null;
	ITEM_RE.lastIndex = 0;
	let m;
	while ((m = ITEM_RE.exec(text)) && m.index < idx) {
		best = { code: m[1], title: m[2].replace(/\s+/g, ' ').trim() };
	}
	return best;
}

const RESULT_RE = /(CARRIED UNANIMOUSLY|CARRIED \((\d+) to (\d+)\)|DEFEATED \((\d+) to (\d+)\))/g;

function parseVotes(text, meeting) {
	const present = parsePresent(text);
	const votes = [];
	RESULT_RE.lastIndex = 0;
	let m;
	let prevEnd = 0;
	let seq = 0;
	while ((m = RESULT_RE.exec(text))) {
		const resultText = m[1];
		const carried = /CARRIED/i.test(resultText);
		const unanimous = /UNANIMOUSLY/i.test(resultText);
		const forCount = unanimous ? present.length : Number(m[2] ?? m[4]);
		const againstCount = unanimous ? 0 : Number(m[3] ?? m[5]);

		// Name blocks belong to THIS result only: search the window since the previous result.
		const windowStart = prevEnd;
		const opposed = unanimous
			? { names: [] }
			: parseNameBlock(text, 'OPPOSED', windowStart, m.index);
		const conflict = parseNameBlock(text, 'CONFLICT', windowStart, m.index);
		const opposedNames = opposed?.names ?? [];
		const conflictNames = conflict?.names ?? [];

		// Derive in-favour and validate against the (a to b) tally.
		const inFavour = present.filter((c) => !opposedNames.includes(c) && !conflictNames.includes(c));
		const valid =
			unanimous ||
			(opposedNames.length === againstCount && inFavour.length === forCount && forCount > 0);

		const item = nearestItem(text, m.index);
		votes.push({
			id: `${meeting.documentId}-${seq++}`,
			meetingName: meeting.name,
			meetingDate: meeting.date,
			itemCode: item?.code,
			motion: item?.title || 'Motion',
			result: unanimous
				? 'Carried unanimously'
				: `${carried ? 'Carried' : 'Defeated'} ${forCount} to ${againstCount}`,
			carried,
			unanimous,
			forCount,
			againstCount,
			opposed: opposedNames,
			inFavour: valid ? inFavour : [],
			conflict: conflictNames,
			split: !unanimous && opposedNames.length > 0,
			valid
		});
		prevEnd = RESULT_RE.lastIndex;
	}
	return votes;
}

async function main() {
	console.log(`Scraping council votes (last ${MONTHS_BACK} months)…`);
	const meetings = await getMeetings();
	console.log(`Found ${meetings.length} meetings with adopted minutes.`);

	const dir = mkdtempSync(join(tmpdir(), 'votes-'));
	const allVotes = [];
	const processedMeetings = [];
	try {
		for (const mtg of meetings) {
			try {
				const text = await pdfText(mtg.documentId, dir);
				const votes = parseVotes(text, mtg);
				allVotes.push(...votes);
				processedMeetings.push({ ...mtg, voteCount: votes.length });
				console.log(`  ${mtg.date} ${mtg.name}: ${votes.length} votes`);
				await sleep(1000); // be polite
			} catch (err) {
				console.warn(`  skip ${mtg.date} ${mtg.name}: ${err.message}`);
			}
		}
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}

	allVotes.sort((a, b) => (a.meetingDate < b.meetingDate ? 1 : -1));

	// Per-councillor scorecard: dissents (opposed on a split vote) + participation.
	const scorecard = COUNCILLORS.map((name) => {
		const present = allVotes.filter(
			(v) => v.valid && (v.inFavour.includes(name) || v.opposed.includes(name))
		);
		const dissents = allVotes.filter((v) => v.opposed.includes(name));
		return {
			name,
			votesRecorded: present.length,
			dissents: dissents.length,
			conflicts: allVotes.filter((v) => v.conflict.includes(name)).length
		};
	});

	mkdirSync(dirname(OUT), { recursive: true });
	const payload = {
		generatedAt: new Date().toISOString(),
		source: 'City of Victoria eSCRIBE minutes',
		meetingsProcessed: processedMeetings.length,
		latestMeeting: allVotes[0]?.meetingDate ?? null,
		councillors: COUNCILLORS,
		scorecard,
		votes: allVotes.slice(0, 400)
	};
	writeFileSync(OUT, JSON.stringify(payload, null, '\t') + '\n');
	console.log(`Wrote ${allVotes.length} votes from ${processedMeetings.length} meetings to ${OUT}`);
}

main().catch((err) => {
	console.error('Scrape failed:', err);
	process.exit(1);
});
