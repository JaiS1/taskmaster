# Drunk TaskMaster

A Taskmaster-style party game for game nights. Set up teams, pick challenges off a board, reveal multi-part tasks (sealed with a wax stamp), award points, and watch the live leaderboard. Built as a fast, no-install web app — everything runs in the browser and persists locally, so you can pause a session mid-party and resume right where you left off.

## Features

- **Team setup** — add, rename, and reorder teams (ships with three presets)
- **Task board** — nine built-in challenges, marked complete as you go
- **Task reveal** — multi-part prompts with a wax-seal reveal, plus per-task widgets (e.g. the Dictionary letter board)
- **Scoring** — per-round point awards with a live, ranked leaderboard drawer
- **Built-in timer** — countdown or stopwatch for timed tasks
- **House rules** screen
- **Session persistence** — saved to `localStorage`; resume any time

## The tasks

| Task | Gist |
| --- | --- |
| Ach-who? | Be the first to make a nominated teammate genuinely sneeze. |
| Meet X | Interview a mystery guest, then write and perform a one-minute song about them. |
| Shades of Silence | Pick a crayon and, with no talking, paint a group masterpiece. |
| Detective | Crack the hidden secret word. |
| Dolphins | Guide a banished teammate to a secret task using only "yays" and "boos." |
| Dictionary.com | Make the longest valid word from two letters in 30 seconds. |
| Last Word Standing | Rapid-fire word duel; the required word grows a letter with every elimination. |
| Knot or Not | Tie your team's hands into one knot, then race to solve a puzzle. |
| Conga Line | Draw a secret image finger-by-finger down a line of backs, telephone-style. |

## Tech

React 19, TypeScript, Vite, and `lucide-react` for icons. No backend.

## Run it

```bash
npm install
npm run dev
```

Then open the printed `localhost` URL.

## Build

```bash
npm run build
npm run preview
```
