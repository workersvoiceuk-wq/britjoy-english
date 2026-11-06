# Question-linked teaching examples — review handoff

Date: 2026-11-06. Original Antigravity delivery: LUMI `51645648dbd7ba4db058d8d494f19148c42e5f89`, based on `7448a3d81cf971366419542e39350ef66bf2b9b0`. BritJoy integration is based on `2ea76d78c6c645cfb80b2f984e1289015f9afd39`.

Antigravity stopped at its individual quota before completing the second repository handoff. ChatGPT reviewed and completed the integration in isolated review branches. No deployment, store submission, price, account or access change is included.

## Behaviour
- Seven original concepts: English morning greetings, Spanish ser, UK individual liberty, AI prompts, GB red signals, confidentiality and electric-current units.
- A discreet example/explanation control appears only for an explicitly mapped lesson/question.
- Videos play only with editorial status `ready` and an actual relative MP4/WebM path. All seven initial entries remain `draft`, with null media paths. The two separately produced sample videos are still under review and are not published in this repository.
- Missing media retains the written explanation and illustrative steps. No autoplay or completion/XP changes.
- Closing, switching questions/languages, hiding the page, or destroying the component stops playback.
- BritJoy includes the same shared manifest/module; its existing lesson catalogue does not independently provide all seven full courses. Only existing matching lesson/exercise contexts receive help.

## Review corrections
- Reject image/caption files in video slots and unsupported/encoded paths.
- A specific unmapped exercise cannot inherit an unrelated lesson-wide video.
- Remove eight unsupported mappings (including STOP signs vs red traffic lights, naming vs ser, instruction injection vs a basic prompt, authentication vs confidentiality, series circuits vs current units, and utility bills vs electrical quantities).
- Stop the previous video before replacing an open panel during a refresh.
- Universal concepts also work when a learner has an explicit country setting.
- Keep shared module and stylesheet byte-identical between repositories.

Shared module SHA-256: `8af93b3daa3b9166c5853254f3970977dc21bf94990d4c47159f079ff0369c3d`.

## Validation
- LUMI: 28 controller/helper tests pass, including four new regression tests and the cross-repository byte comparison.
- LUMI: original source archive verified against `source.sha256`, extracted, then overlaid with the reviewed updates. Web build passes; all 19 bundled app tests pass.
- BritJoy: TypeScript and Vite web build pass; 73 existing logic/interface tests and 3 new mapping/review tests pass.
- BritJoy's full content suite is not certified in this partial checkout: 140 media-existence assertions require the existing public video assets, which were not downloaded. No placeholder media were created to make those assertions pass. This limitation is unrelated to activating the new seven draft videos.
- No claim of a physical Android/iPhone run, native signed build, full visual browser review or final voice/lip-sync approval.

## Next integration gate
Review the branches against the current production integration branch, preserving concurrent Claude/Sites work. Receive approved MP4, actual transcript/VTT, duration and hashes per concept before setting any entry to `ready`. Generate further samples in small reviewed batches.
