---
title: "Plain text outlives everything"
description: "The fancy formats die — WordStar, WordPerfect, Lotus 1-2-3, Flash — while a plain .txt file stays readable on every machine, effectively forever."
date: 2026-04-28
tags: ["forge"]
accent: "#22d3ee"
glyph: "circuit"
---

Somewhere on an old hard drive you have a file you can no longer open. Not because the disk is dead — the disk is fine — but because the program that wrote it has been dead for twenty years, and it took the only key to its own door with it. Maybe it was a WordPerfect document, all reveal-codes and blue screen. Maybe a Lotus 1-2-3 spreadsheet, the software that once *was* the IBM PC the way water is the sea. The bytes are still sitting there, patient and intact. They are simply illegible, because they were written in a private language spoken by exactly one application, and that application is gone.

This is the quiet tragedy of the proprietary file format, and it has claimed almost everything. WordStar ruled writing in the early eighties and is now an archaeology project. The Macromedia — later Adobe — Flash format animated half the early web, then was switched off worldwide on the last day of 2020, taking a generation of games and cartoons with it. Even Microsoft's own ".doc" has quietly turned over its internals so many times that the safest way to open a file from 1997 is often to not have made it a .doc in the first place.

## A format is a promise, and most promises lapse

A file format is really just a deal. The software promises that if you arrange the bytes *this* way, it will give your words and numbers back to you later. The trouble is that the software is the only party enforcing the deal, and software is mortal. Companies fold. Products get discontinued the moment they stop selling. A format owned by a vendor lives exactly as long as that vendor finds it profitable to keep the reader alive — not a day longer.

Plain text made no such deal, because it barely is one. A .txt file is just characters, one after another, in an encoding — these days UTF-8 — that essentially every device on earth already understands. There is no proprietor to go bankrupt. There is no licence to expire. The "reader" isn't an application you have to keep installing; it's a baseline capability baked into every operating system, every phone, every fridge with a screen. Nothing has to *survive* for plain text to keep working, which is precisely why it does.

## The simplest format is the most useful one

It would be a tidy story if plain text merely endured. In fact it does more, and the reasons it lasts are the same reasons it works harder than the formats that buried themselves.

You can read it with your eyes. Open a .txt or a Markdown file in literally anything and the content is right there, no decoding ceremony required. It is absurdly small — a novel in plain text is a fraction of the same novel wrapped in a word processor's scaffolding of fonts, revision history and embedded clip art. And because it's just lines of characters, a computer can compare two versions and show you exactly what changed, which is the whole foundation of version control. Programmers have quietly bet their entire civilisation on this: the source code running the modern world is plain text, tracked line by line, precisely because the format refuses to hide anything.

That refusal is the trick. The proprietary formats lost by being clever — by hoarding their structure inside a binary blob only they could parse. Plain text wins by being dumb on purpose. It keeps no secrets, so nobody has to be alive to tell you them.

## The file that will still open in 2124

There is a particular vanity in a beautifully formatted document. The kerning, the drop shadows, the carefully chosen heading style — it feels permanent, the way a printed book feels permanent. It is not. It is a tenant in someone else's building, and the landlord is under no obligation to keep the lights on.

So here is the slightly grim arithmetic of digital memory. Your elaborate document may well outlive *you* — but it will not outlive the app that opens it, and that app is on a much shorter clock than either of you. The .txt file you save tonight, by contrast, asks nothing of the future. No subscription, no migration, no frantic search for a converter. Long after the software that impressed you has been switched off for good, somebody in 2124 will double-click a plain text file and watch it open, instantly, exactly as you left it — because the cheapest, ugliest, most unglamorous format we ever invented is the only one that was honest enough to last.
