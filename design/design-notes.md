# Design Source

The app is built to match the provided source-of-truth design, captured in this
folder:

- `gilded-octave-stitch.html` - the full bundled "All Screens" design export.
- `gilded-octave-screen.html` - the unpacked single-screen design (hub, play,
  win, game-over, and the tier/difficulty/win-lose specs).

The build follows it exactly: layout, the opera color palette, typography, and
the merge mechanics.

## Design system
| Token | Value |
|-------|-------|
| Background | radial `#3a1014 → #260a0d → #160608` |
| Gold | `#c9a14a` / bright `#e6c878` / soft `#b88a3e` |
| Crimson (stage button / curtain) | `#7a1623 → #56101a` |
| Cream / ivory text | `#f4ead5` / `#f3e7cf` |
| Danger | `#d6453a` |
| Display font | Marcellus |
| Small-caps labels | Marcellus SC |
| Body / italic | EB Garamond |

## The gem ladder (ten jewels, one note each)
Garnet (Do/C4) · Citrine (Re) · Topaz (Mi) · Peridot (Fa) · Emerald (Sol) ·
Aquamarine (La) · Sapphire (Ti) · Amethyst (Do/C5) · Morganite (Re) ·
Diamond (Mi) -> two Diamonds fuse into the **Mega Diamond** end-goal.

## Difficulty curve (the accelerando)
`interval(t) = t < 15 ? 4.0 : max(1.1, 4.0 × 0.85^(⌊(t−15)/12⌋ + 1))`
Calm 15s opening at 4.0s drops, shortening 15% every 12s down to a 1.1s floor.
Tempo names: Adagio → Andante → Allegro → Vivace → Presto.
