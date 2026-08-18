# Phrase Snippets — Scenario Reference

Every `;<rolecode><n>` shorthand, plus a filled example showing the
`;;` popup output when the form fields are typed in. Regenerate:

```
node extension/generate-snippets-doc.mjs
```

`####` marks a required field the user still has to fill in (red-bold in the rich-text version, tab-cycled). Optional fields wrapped in `[…]` in the template (e.g. the resident name) drop out cleanly when left blank — see each "Empty" line.

Every log is auto-prefixed with the current clock time, e.g. `10:00 AM: Resident…`. The doc pins it to `10:00 AM` for stable diffs.

Sample values used in the "Filled" line for text/date fields: name=`John`, unit=`234`, recipient=`Helen`, description=`their kitchen sink is leaking`, date=`2026-05-02`, subject=`a maintenance follow-up`, item=`a rent check`, staff=`Sarah`, deliveredDate=`2026-04-25`, guestName=`Marcus`. Select/radio fields use the first option of each field.

## Roles at a glance

- `re` — Resident (9 reasons; role fields: name, unit, contact)
- `gu` — Guest (5 reasons; role fields: name, unit, residentName, contact)
- `ad` — App delivery (2 reasons; role fields: name, unit)
- `dw` — Dog Walker (3 reasons; role fields: name, unit)
- `cl` — Cleaner (3 reasons; role fields: name, unit)
- `bs` — Baby Sitter (2 reasons; role fields: name, unit)
- `ve` — Vendor (2 reasons; role fields: name, unit)
- `it` — Item / property (4 reasons; role fields: name, unit)
- `mo` — Move in/out keys (2 reasons; role fields: name, unit)
- `mt` — Maintenance (2 reasons; role fields: name)
- `lo` — Leasing Office (3 reasons; role fields: name)
- `pr` — Prospect (2 reasons; role fields: name)
- `pk` — Package (4 reasons; role fields: courier, courierOther)
- `co` — Concierge (7 reasons; role fields: name)
- `pp` — Pilgrim Parking (3 reasons; role fields: name)

## Resident — `re`

### `;re1` — Drop off for pickup

- **Empty:** 10:00 AM: Resident from unit (####) came to the front desk to drop keys for #### to pick-up later. (stored ####)
- **Filled:** 10:00 AM: Resident John from unit (234) came to the front desk to drop keys for Helen to pick-up later. (stored by desk cabinet)

### `;re2` — Pick up keys

- **Empty:** 10:00 AM: Resident from unit (####) came to the front desk to pick up keys that were left for them after identification was confirmed.
- **Filled:** 10:00 AM: Resident John from unit (234) came to the front desk to pick up keys that were left for them after identification was confirmed.

### `;re3` — Report something

- **Empty:** 10:00 AM: Resident from unit (####) came to the front desk to report that ####.
- **Filled:** 10:00 AM: Resident John from unit (234) came to the front desk to report that their kitchen sink is leaking.

### `;re4` — Missing package

- **Empty:** 10:00 AM: Resident from unit (####) came to the front desk to inquire about a missing package from #### that was delivered on ####.
- **Filled:** 10:00 AM: Resident John from unit (234) came to the front desk to inquire about a missing package from Amazon that was delivered on 2026-04-25.

### `;re5` — Unit lockout

- **Empty:** 10:00 AM: Resident from unit (####) came to the front desk to request entry into their unit because they forgot their keys.
- **Filled:** 10:00 AM: Resident John from unit (234) came to the front desk to request entry into their unit because they forgot their keys.

### `;re6` — Grabbed dolly

- **Empty:** 10:00 AM: Resident from unit (####) came to the front desk to grab a dolly; the concierge assisted after confirmation.
- **Filled:** 10:00 AM: Resident John from unit (234) came to the front desk to grab a dolly; the concierge assisted after confirmation.

### `;re7` — Request elevator access

- **Empty:** 10:00 AM: Resident from unit (####) came to the front desk to request elevator access; access was granted after confirmation.
- **Filled:** 10:00 AM: Resident John from unit (234) came to the front desk to request elevator access; access was granted after confirmation.

### `;re8` — Picked up packages

- **Empty:** 10:00 AM: Resident from unit (####) came to the front desk to pick up packages.
- **Filled:** 10:00 AM: Resident John from unit (234) came to the front desk to pick up packages.

### `;re9` — Send a guest up

- **Empty:** 10:00 AM: Resident from unit (####) came to the front desk to request that guest #### be sent up.
- **Filled:** 10:00 AM: Resident John from unit (234) came to the front desk to request that guest Marcus be sent up.

## Guest — `gu`

### `;gu1` — Visit resident

- **Empty:** 10:00 AM: Guest of unit (####) came to the front desk to visit resident, elevator access ####.
- **Filled:** 10:00 AM: Guest John of unit (234 Marry) came to the front desk to visit resident, elevator access granted after resident confirmation via call.

### `;gu2` — Pick up keys

- **Empty:** 10:00 AM: Guest of unit (####) came to the front desk to pick up keys that were left for them after identification was confirmed.
- **Filled:** 10:00 AM: Guest John of unit (234 Marry) came to the front desk to pick up keys that were left for them after identification was confirmed.

### `;gu3` — Drop off for pickup

- **Empty:** 10:00 AM: Guest of unit (####) came to the front desk to drop keys for ####. (stored ####)
- **Filled:** 10:00 AM: Guest John of unit (234 Marry) came to the front desk to drop keys for Helen. (stored by desk cabinet)

### `;gu4` — Given unit keys

- **Empty:** 10:00 AM: Guest came to the front desk for unit (####) and requested unit keys; ####.
- **Filled:** 10:00 AM: Guest John came to the front desk for unit (234 Marry) and requested unit keys; confirmed with the resident via call, keys exchanged for an ID.

### `;gu5` — Sent up — per earlier request

- **Empty:** 10:00 AM: Guest of unit (####) came to the front desk and was sent up as per the resident's earlier request.
- **Filled:** 10:00 AM: Guest John of unit (234 Marry) came to the front desk and was sent up as per the resident's earlier request.

## App delivery — `ad`

### `;ad1` — Delivered — awaiting pickup

- **Empty:** 10:00 AM: App delivery for unit (####) was delivered and is awaiting pick-up at the front desk; ####.
- **Filled:** 10:00 AM: App delivery from John for unit (234) was delivered and is awaiting pick-up at the front desk; the resident was reached and notified.

### `;ad2` — Not picked up >30 min — stored

- **Empty:** 10:00 AM: App delivery for unit (####) has not been picked-up for more than 30 minutes; resident notified and the delivery was stored in the fridge.
- **Filled:** 10:00 AM: App delivery from John for unit (234) has not been picked-up for more than 30 minutes; resident notified and the delivery was stored in the fridge.

## Dog Walker — `dw`

### `;dw1` — Sent up

- **Empty:** 10:00 AM: Dog walker arrived for unit (####); ####.
- **Filled:** 10:00 AM: Dog walker John arrived for unit (234); sent up after resident confirmation via call.

### `;dw2` — Picked up unit keys

- **Empty:** 10:00 AM: Dog walker arrived for unit (####) and requested unit keys; ####.
- **Filled:** 10:00 AM: Dog walker John arrived for unit (234) and requested unit keys; confirmed with the resident via call, keys exchanged for an ID.

### `;dw3` — Returned unit keys

- **Empty:** 10:00 AM: Dog walker returned the unit keys for unit (####) to the front desk and their ID was handed back.
- **Filled:** 10:00 AM: Dog walker John returned the unit keys for unit (234) to the front desk and their ID was handed back.

## Cleaner — `cl`

### `;cl1` — Sent up

- **Empty:** 10:00 AM: Cleaner arrived for unit (####); ####.
- **Filled:** 10:00 AM: Cleaner John arrived for unit (234); sent up after resident confirmation via call.

### `;cl2` — Picked up unit keys

- **Empty:** 10:00 AM: Cleaner arrived for unit (####) and requested unit keys; ####.
- **Filled:** 10:00 AM: Cleaner John arrived for unit (234) and requested unit keys; confirmed with the resident via call, keys exchanged for an ID.

### `;cl3` — Returned unit keys

- **Empty:** 10:00 AM: Cleaner returned the unit keys for unit (####) to the front desk and their ID was handed back.
- **Filled:** 10:00 AM: Cleaner John returned the unit keys for unit (234) to the front desk and their ID was handed back.

## Baby Sitter — `bs`

### `;bs1` — Sent up

- **Empty:** 10:00 AM: Baby sitter arrived for unit (####); ####.
- **Filled:** 10:00 AM: Baby sitter John arrived for unit (234); sent up after resident confirmation via call.

### `;bs2` — Given unit keys

- **Empty:** 10:00 AM: Baby sitter arrived for unit (####) and requested unit keys; ####.
- **Filled:** 10:00 AM: Baby sitter John arrived for unit (234) and requested unit keys; confirmed with the resident via call, keys exchanged for an ID.

## Vendor — `ve`

### `;ve1` — Picked up vendor keys

- **Empty:** 10:00 AM: Vendor requested vendor keys; ####.
- **Filled:** 10:00 AM: Vendor John requested vendor keys for unit (234); confirmed with the resident via call, keys exchanged for an ID.

### `;ve2` — Returned vendor keys

- **Empty:** 10:00 AM: Vendor returned the vendor keys to the front desk and their ID was handed back.
- **Filled:** 10:00 AM: Vendor John returned the vendor keys for unit (234) to the front desk and their ID was handed back.

## Item / property — `it`

### `;it1` — Dropped off for someone

- **Empty:** 10:00 AM: Resident of unit (####) dropped off #### at the front desk for #### to collect. Stored ####.
- **Filled:** 10:00 AM: Resident John of unit (234) dropped off a rent check at the front desk for Helen to collect. Stored by desk cabinet.

### `;it2` — Collected from the desk

- **Empty:** 10:00 AM: #### collected #### from the front desk; identification confirmed.
- **Filled:** 10:00 AM: John collected a rent check from the front desk for unit (234); identification confirmed.

### `;it3` — Left for storage

- **Empty:** 10:00 AM: Resident of unit (####) left #### at the front desk to collect later. Stored ####.
- **Filled:** 10:00 AM: Resident John of unit (234) left a rent check at the front desk to collect later. Stored by desk cabinet.

### `;it4` — Found property

- **Empty:** 10:00 AM: #### was found at #### and turned in to the front desk. ####
- **Filled:** 10:00 AM: a rent check was found at #### and turned in to the front desk. Marked unknown and left at the leasing office.

## Move in/out keys — `mo`

### `;mo1` — Keys returned

- **Empty:** 10:00 AM: #### keys for unit (####) were returned to the front desk and ####.
- **Filled:** 10:00 AM: Move-out keys for unit (234) were returned to the front desk by John and delivered to the leasing office.

### `;mo2` — Keys released

- **Empty:** 10:00 AM: #### keys for unit (####) were released; identification confirmed.
- **Filled:** 10:00 AM: Move-out keys for unit (234) were released to John; identification confirmed.

## Maintenance — `mt`

### `;mt1` — Resident reported an issue

- **Empty:** 10:00 AM: Resident of unit (####) reported ####; ####.
- **Filled:** 10:00 AM: Resident of unit (234) reported ####; Emergency Maintenance contact information was provided, the resident was advised same-evening response could not be guaranteed, and the maintenance team will be notified for follow-up.

### `;mt2` — Maintenance on site

- **Empty:** 10:00 AM: Maintenance arrived on site regarding ####.
- **Filled:** 10:00 AM: Maintenance John arrived on site regarding #### for unit (234).

## Leasing Office — `lo`

### `;lo1` — Staff arrived

- **Empty:** 10:00 AM: Leasing office staff arrived regarding ####.
- **Filled:** 10:00 AM: Leasing office staff John arrived regarding a maintenance follow-up.

### `;lo2` — Dropped something off

- **Empty:** 10:00 AM: Leasing office staff dropped off #### for unit (####).
- **Filled:** 10:00 AM: Leasing office staff John dropped off a rent check for unit (234).

### `;lo3` — Picked something up

- **Empty:** 10:00 AM: Leasing office staff picked up #### from the front desk.
- **Filled:** 10:00 AM: Leasing office staff John picked up a rent check from the front desk.

## Prospect — `pr`

### `;pr1` — Walk-in tour

- **Empty:** 10:00 AM: Prospect walked in for a tour; the leasing team was informed.
- **Filled:** 10:00 AM: Prospect John walked in for a tour; the leasing team was informed.

### `;pr2` — Scheduled tour with leasing

- **Empty:** 10:00 AM: Prospect arrived for their scheduled tour with the leasing team; leasing was informed.
- **Filled:** 10:00 AM: Prospect John arrived for their scheduled tour with the leasing team; leasing was informed.

## Package — `pk`

### `;pk1` — Dropped a bulk of packages

- **Empty:** 10:00 AM: #### dropped off a bulk of packages at the front desk.
- **Filled:** 10:00 AM: Amazon dropped off a bulk of packages at the front desk.

### `;pk2` — On site

- **Empty:** 10:00 AM: #### arrived on site.
- **Filled:** 10:00 AM: Amazon arrived on site.

### `;pk3` — Picked up returns

- **Empty:** 10:00 AM: #### picked up returns from the front desk.
- **Filled:** 10:00 AM: Amazon picked up returns from the front desk.

### `;pk4` — Report something

- **Empty:** 10:00 AM: #### came to the front desk to report that ####.
- **Filled:** 10:00 AM: Amazon came to the front desk to report that their kitchen sink is leaking.

## Concierge — `co`

### `;co1` — On break

- **Empty:** 10:00 AM: Concierge went on break.
- **Filled:** 10:00 AM: Concierge John went on break.

### `;co2` — Back from break

- **Empty:** 10:00 AM: Concierge returned from break.
- **Filled:** 10:00 AM: Concierge John returned from break.

### `;co3` — On site touring

- **Empty:** 10:00 AM: Concierge left the front desk for a site tour.
- **Filled:** 10:00 AM: Concierge John left the front desk for a site tour.

### `;co4` — Contacted resident

- **Empty:** 10:00 AM: Concierge contacted the resident in unit (####) regarding ####; ####.
- **Filled:** 10:00 AM: Concierge John contacted the resident in unit (234) regarding ####; the resident was reached and notified.

### `;co5` — Sorted/processed packages

- **Empty:** 10:00 AM: Concierge sorted and processed packages in the package room while maintaining visibility at the front desk.
- **Filled:** 10:00 AM: Concierge John sorted and processed packages in the package room while maintaining visibility at the front desk.

### `;co6` — Cleaned up / made safe

- **Empty:** 10:00 AM: Concierge addressed #### at ####. ####
- **Filled:** 10:00 AM: Concierge John addressed #### at ####. Caution Wet Floor signage was placed.

### `;co7` — Reviewed cameras

- **Empty:** 10:00 AM: Concierge reviewed the security cameras; ####.
- **Filled:** 10:00 AM: Concierge John reviewed the security cameras; no suspicious activity was observed.

## Pilgrim Parking — `pp`

### `;pp1` — Report something

- **Empty:** 10:00 AM: Pilgrim Parking staff came to the front desk to report that ####.
- **Filled:** 10:00 AM: Pilgrim Parking staff John came to the front desk to report that their kitchen sink is leaking.

### `;pp2` — Resident parking inquiry

- **Empty:** 10:00 AM: Resident of unit (####) inquired about #### for a #### (#### plate ####); ####.
- **Filled:** 10:00 AM: Resident of unit (234) inquired about overnight parking for a #### (#### plate ####); the resident was advised the concierge would follow up once parking guidance is confirmed.

### `;pp3` — Drop something off

- **Empty:** 10:00 AM: Pilgrim Parking staff dropped off #### at the front desk.
- **Filled:** 10:00 AM: Pilgrim Parking staff John dropped off a rent check at the front desk for unit (234).

