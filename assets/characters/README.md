# Character imagery — specification

The site currently shows **labeled placeholders** in every character slot. Replace them with
original, properly licensed, photorealistic AI-generated character images.

## Rights (required before publishing)
- Only use imagery you own or have a written license for, including commercial resale/sub-licensing
  if characters are sold in the Marketplace.
- No real people's likenesses without a signed release. No stock photos of identifiable people.
- Keep the generation tool's license terms with each asset (`license.txt` in the character folder).

## Art direction
- Photorealistic adult humans, natural proportions, realistic skin texture, professional expressions.
- Professional studio photography look: soft key light, gentle rim light, neutral color grading.
- Three-quarter or front-facing, waist-up framing for the main image.
- Consistent lighting and camera height across the whole catalog.
- Styling describes clothing only; never imply nationality or language from appearance.
- Not cartoon, Pixar, clay, toy or fantasy styles.

## Files per character (`assets/characters/<id>/`)
| File | Spec |
| --- | --- |
| `main.webp` | Transparent background, 1200×1600 px (3:4), subject centered, feet/waist cropped consistently |
| `main.png` | Same as above (fallback / customer delivery) |
| `pose-*.webp` | Optional additional poses, same framing |
| `expression-*.webp` | Optional expression variants (smile, neutral, thinking…) |
| `loop.webm` / `loop.mp4` | Optional short, muted, looping clip (idle breathing / small motion only) |
| `license.txt` | Source tool, license terms, date, generator prompt reference |

## Publishing a character
1. Add the files above.
2. In `js/data/catalog.js`, set `media.image` (and `poses`, `expressions`, `loop` if available).
3. Remove `sample: true` once the character is approved for sale.

Static images are animated with subtle CSS only (float, hover, entrance). Talking, blinking or
lip-sync require separate animation/video assets and are not implied by the site.

## Supplied artwork (Nov 2026)
Studio portraits (1376×768 PNG, plain #efefe6 backdrop) live in this folder under their original
filenames and are referenced explicitly via `media: photo('<file>')` in `js/data/catalog.js`
(framed with `object-fit: cover`: only empty backdrop is trimmed, never the person).

| Character | File |
| --- | --- |
| Faisal | `magnific_premium-photorealistic-aigenerated-saudi_6AHF1WNiJO.png` |
| Omar | `magnific_he-should-have-a-mature_s7oBhWYl8e (1).png` |
| Karim | `magnific_he-should-look_ksDMoXo16B.png` |
| Adam | `magnific_photorealistic-male-digital-assistant_Bh4P627oQR.png` |
| Reem | `magnific_she-should-have-distinctive-natural-facial-features_tCi6G7vmZJ.png` |
| Lina | `magnific_premium-photorealistic-aigenerated-egyptian_s7oBmBBl8e.png` |
| Salma | `magnific_she-should-look_1lpDovir4r.png` |
| Nour | `magnific_premium-photorealistic-aigenerated-egyptian_u5nzVmXQLD.png` |

## Talking-character videos (verified frame by frame, Nov 2026)
Muted loops (5 s, 1280–1284×716, H.264) referenced as `media.video` in `js/data/catalog.js`;
the portrait stays as poster + fallback. Played by `js/ui/character-video.js` (hover/focus on
mouse devices, while visible on touch devices; never with reduced motion).

| Character | Video |
| --- | --- |
| Faisal | `magnific_animate-the-exact-character_ksDqrda16B.mp4` |
| Reem | `magnific_animate-the-exact-character_bxTQkJL5Y2.mp4` |
| Salma | `magnific_animate-the-exact-character_If6XhiztvE.mp4` |
| Milo | `magnific_video-generator_UPmsORHwny.mp4` |
| Nour | `magnific_video-generator_Ebzv0qbuuO.mp4` |
| Karim | `magnific_video-generator_cplz7IH0eP.mp4` |
| Lina | `magnific_video-generator_huR8zyWvqL.mp4` |
| Adam · Omar · Nova | — no video yet |

Unmatched videos (kept, not used): `…animate-this-exact-character-portrait_WDsA3rucXe.mp4` (green robot
mascot), `…video-generator_WDsGJMMcXe.mp4` (stylized 3D woman) — neither has a catalog entry.
Note: filename IDs are NOT reliable for matching (e.g. `…bxTQkJL5Y2.mp4` is Reem, not Nova).

Milo and Nova (now marketplace listings; also used in the homepage product scenes):

| Character | File |
| --- | --- |
| Milo (stylized 3D, in-app assistant) | `magnific_premium-stylized-3d-egyptian-male-character_LwBXvCuswO.png` |
| Nova (near-human, digital presenter) | `magnific_premium-photorealistic-nearhuman_bxT0XgK5Y2.png` |

Unmatched (kept, not used): `…he-should-look-mostly-human_UPmtud7wny.png`, 
`…original-premium-abstract-3d-brand-mascot_gOI8u6FSXO.png`, `…premium-stylized-3d-egyptian-female_lJ8oCSfgv9.png`.

`license.txt` files are still missing for every character.
