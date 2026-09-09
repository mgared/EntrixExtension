# Phrase Snippets — Scenario Reference

Every reason, plus a filled example showing the
`;;` popup output when the form fields are typed in. Regenerate:

```
node extension/generate-snippets-doc.mjs
```

`####` marks a required field the user still has to fill in (red-bold in the rich-text version, tab-cycled). Optional fields wrapped in `[…]` in the template (e.g. the resident name) drop out cleanly when left blank — see each "Empty" line.

Every log is auto-prefixed with the current clock time, e.g. `10:00 AM: Resident…`. The doc pins it to `10:00 AM` for stable diffs.

Sample values used in the "Filled" line for text/date fields: name=`John`, unit=`234`, recipient=`Helen`, description=`their kitchen sink is leaking`, date=`2026-05-02`, subject=`a maintenance follow-up`, item=`a rent check`, staff=`Sarah`, deliveredDate=`2026-04-25`, guestName=`Marcus`, bookingDate=`2026-05-02`, slot=`9:00 AM – 12:00 PM`. Select/radio fields use the first option of each field.

## Roles at a glance

- Resident (11 reasons; role fields: name, unit, contact)
- Guest (6 reasons; role fields: name, unit, residentName, contact)
- App delivery (4 reasons; role fields: app, appOther, unit)
- Dog Walker (5 reasons; role fields: name, company, unit)
- Cleaner (5 reasons; role fields: name, company, unit)
- Vendor (4 reasons; role fields: name, company, forWhat, unit, area)
- Item / property (2 reasons; role fields: name, unit)
- Maintenance (4 reasons; role fields: name)
- Leasing Office (5 reasons; role fields: name)
- Prospect (2 reasons; role fields: name, contactInfo)
- Package (4 reasons; role fields: courier, courierOther)
- Concierge (7 reasons; role fields: name)
- Pilgrim Parking (4 reasons; role fields: name)

## Resident

### Drop off for pickup

- **Empty:** 10:00 AM: Resident from unit (####) came to the front desk to drop keys for #### to pick-up later. (stored ####)
- **Filled:** 10:00 AM: Resident John from unit (234) came to the front desk to drop keys for Helen to pick-up later. (stored by desk cabinet)

### Pick up something left for them

- **Empty:** 10:00 AM: Resident from unit (####) came to the front desk to pick up keys left for them after identification was confirmed.
- **Filled:** 10:00 AM: Resident John from unit (234) came to the front desk to pick up keys left for them after identification was confirmed.

### Report something

- **Empty:** 10:00 AM: Resident from unit (####) came to the front desk to report that ####.
- **Filled:** 10:00 AM: Resident John from unit (234) came to the front desk to report that their kitchen sink is leaking. Emergency Maintenance contact information was provided for the resident to call directly, and the resident was advised same-evening response could not be guaranteed.

### Missing package

- **Empty:** 10:00 AM: Resident from unit (####) came to the front desk to inquire about a missing package from #### that was delivered on ####.
- **Filled:** 10:00 AM: Resident John from unit (234) came to the front desk to inquire about a missing package from Amazon that was delivered on 2026-04-25.

### Unit lockout

- **Empty:** 10:00 AM: Resident from unit (####) came to the front desk to request entry into their unit because they forgot their keys.
- **Filled:** 10:00 AM: Resident John from unit (234) came to the front desk to request entry into their unit because they forgot their keys.

### Grabbed dolly

- **Empty:** 10:00 AM: Resident from unit (####) came to the front desk to grab a dolly; the concierge assisted after confirmation.
- **Filled:** 10:00 AM: Resident John from unit (234) came to the front desk to grab a dolly; the concierge assisted after confirmation.

### Request elevator access

- **Empty:** 10:00 AM: Resident from unit (####) came to the front desk to request elevator access; access was granted after confirmation.
- **Filled:** 10:00 AM: Resident John from unit (234) came to the front desk to request elevator access; access was granted after confirmation.

### Picked up packages

- **Empty:** 10:00 AM: Resident from unit (####) came to the front desk to pick up packages.
- **Filled:** 10:00 AM: Resident John from unit (234) came to the front desk to pick up packages.

### Send a guest up

- **Empty:** 10:00 AM: Resident from unit (####) came to the front desk to request that guest #### be sent up.
- **Filled:** 10:00 AM: Resident John from unit (234) came to the front desk to request that guest Marcus be sent up.

### Returned dolly

- **Empty:** 10:00 AM: Resident from unit (####) returned the dolly to the front desk.
- **Filled:** 10:00 AM: Resident John from unit (234) returned the dolly to the front desk.

### Asked to speak with leasing

- **Empty:** 10:00 AM: Resident from unit (####) came to the front desk to speak with the leasing office; ####.
- **Filled:** 10:00 AM: Resident John from unit (234) came to the front desk to speak with the leasing office; a member of the leasing team came down to assist.

## Guest

### Visit resident

- **Empty:** 10:00 AM: Guest of unit (####) came to the front desk to visit resident, elevator access ####.
- **Filled:** 10:00 AM: Guest John of unit (234 Marry) came to the front desk to visit resident, elevator access granted after resident confirmation via call.

### Pick up something left for them

- **Empty:** 10:00 AM: Guest of unit (####) came to the front desk to pick up keys left for them after identification was confirmed.
- **Filled:** 10:00 AM: Guest John of unit (234 Marry) came to the front desk to pick up keys left for them after identification was confirmed.

### Drop off for pickup

- **Empty:** 10:00 AM: Guest of unit (####) came to the front desk to drop keys for ####. (stored ####)
- **Filled:** 10:00 AM: Guest John of unit (234 Marry) came to the front desk to drop keys for Helen. (stored by desk cabinet)

### Given unit keys

- **Empty:** 10:00 AM: Guest came to the front desk for unit (####) and requested unit keys; ####.
- **Filled:** 10:00 AM: Guest John came to the front desk for unit (234 Marry) and requested unit keys; confirmed with the resident via call, keys exchanged for an ID.

### Returned unit keys

- **Empty:** 10:00 AM: Guest returned the unit keys for unit (####) to the front desk and their ID was handed back.
- **Filled:** 10:00 AM: Guest John returned the unit keys for unit (234 Marry) to the front desk and their ID was handed back.

### Sent up — per earlier request

- **Empty:** 10:00 AM: Guest of unit (####) came to the front desk and was sent up as per the resident's earlier request.
- **Filled:** 10:00 AM: Guest John of unit (234 Marry) came to the front desk and was sent up as per the resident's earlier request.

## App delivery

### Delivered — awaiting pickup

- **Empty:** 10:00 AM: App delivery from #### for unit (####) was delivered and is awaiting pick-up at the front desk; ####.
- **Filled:** 10:00 AM: App delivery from DoorDash for unit (234) was delivered and is awaiting pick-up at the front desk; the resident was reached and notified.

### Not picked up >30 min — stored

- **Empty:** 10:00 AM: App delivery from #### for unit (####) has not been picked-up for more than 30 minutes; ####. The delivery was stored at the front desk.
- **Filled:** 10:00 AM: App delivery from DoorDash for unit (234) has not been picked-up for more than 30 minutes; the resident was reached and notified. The delivery was stored at the front desk.

### Collected by resident

- **Empty:** 10:00 AM: App delivery from #### for unit (####) was collected from the front desk.
- **Filled:** 10:00 AM: App delivery from DoorDash for unit (234) was collected from the front desk.

### Sent up / left at door

- **Empty:** 10:00 AM: App delivery from #### for unit (####) was ####.
- **Filled:** 10:00 AM: App delivery from DoorDash for unit (234) was sent up to the unit after resident confirmation.

## Dog Walker

### Sent up

- **Empty:** 10:00 AM: Dog walker arrived for unit (####); ####.
- **Filled:** 10:00 AM: Dog walker John arrived for unit (234); sent up after resident confirmation via call.

### Picked up unit keys

- **Empty:** 10:00 AM: Dog walker arrived for unit (####) and requested unit keys; ####.
- **Filled:** 10:00 AM: Dog walker John arrived for unit (234) and requested unit keys; confirmed with the resident via call, keys exchanged for an ID.

### Returned unit keys

- **Empty:** 10:00 AM: Dog walker returned the unit keys for unit (####) to the front desk and their ID was handed back.
- **Filled:** 10:00 AM: Dog walker John returned the unit keys for unit (234) to the front desk and their ID was handed back.

### Picked up keys left by resident

- **Empty:** 10:00 AM: Dog walker picked up the keys left for them by the resident of unit (####); identification confirmed, no ID held.
- **Filled:** 10:00 AM: Dog walker John picked up the keys left for them by the resident of unit (234); identification confirmed, no ID held.

### Let in with master key

- **Empty:** 10:00 AM: Dog walker arrived for unit (####); no spare key was available, so the concierge used the master key to open the unit after ####.
- **Filled:** 10:00 AM: Dog walker John arrived for unit (234); no spare key was available, so the concierge used the master key to open the unit after resident confirmation via call.

## Cleaner

### Sent up

- **Empty:** 10:00 AM: Cleaner arrived for unit (####); ####.
- **Filled:** 10:00 AM: Cleaner John arrived for unit (234); sent up after resident confirmation via call.

### Picked up unit keys

- **Empty:** 10:00 AM: Cleaner arrived for unit (####) and requested unit keys; ####.
- **Filled:** 10:00 AM: Cleaner John arrived for unit (234) and requested unit keys; confirmed with the resident via call, keys exchanged for an ID.

### Returned unit keys

- **Empty:** 10:00 AM: Cleaner returned the unit keys for unit (####) to the front desk and their ID was handed back.
- **Filled:** 10:00 AM: Cleaner John returned the unit keys for unit (234) to the front desk and their ID was handed back.

### Picked up keys left by resident

- **Empty:** 10:00 AM: Cleaner picked up the keys left for them by the resident of unit (####); identification confirmed, no ID held.
- **Filled:** 10:00 AM: Cleaner John picked up the keys left for them by the resident of unit (234); identification confirmed, no ID held.

### Let in with master key

- **Empty:** 10:00 AM: Cleaner arrived for unit (####); no spare key was available, so the concierge used the master key to open the unit after ####.
- **Filled:** 10:00 AM: Cleaner John arrived for unit (234); no spare key was available, so the concierge used the master key to open the unit after resident confirmation via call.

## Vendor

### Picked up vendor keys

- **Empty:** 10:00 AM: Vendor requested vendor keys; ####.
- **Filled:** 10:00 AM: Vendor John requested vendor keys for unit (234); confirmed with the resident via call, keys exchanged for an ID.

### Returned vendor keys

- **Empty:** 10:00 AM: Vendor returned the vendor keys to the front desk and their ID was handed back.
- **Filled:** 10:00 AM: Vendor John returned the vendor keys for unit (234) to the front desk and their ID was handed back.

### Arrived / sent up

- **Empty:** 10:00 AM: Vendor arrived; ####.
- **Filled:** 10:00 AM: Vendor John arrived for unit (234); access granted after resident confirmation via call.

### Asked to speak with leasing

- **Empty:** 10:00 AM: Vendor asked to speak with the leasing office; ####.
- **Filled:** 10:00 AM: Vendor John asked to speak with the leasing office; a member of the leasing team came down to assist.

## Item / property

### Left for storage

- **Empty:** 10:00 AM: Resident of unit (####) left keys at the front desk to collect later. Stored ####.
- **Filled:** 10:00 AM: Resident John of unit (234) left keys at the front desk to collect later. Stored by desk cabinet.

### Found property

- **Empty:** 10:00 AM: Property turned in to the front desk: ####, found at ####. ####
- **Filled:** 10:00 AM: Property turned in to the front desk: a rent check, found at ####. Marked unknown and left at the leasing office.

## Maintenance

### On site

- **Empty:** 10:00 AM: Maintenance arrived on site regarding ####.
- **Filled:** 10:00 AM: Maintenance John arrived on site for unit (234) regarding ####.

### Dropped something off

- **Empty:** 10:00 AM: Maintenance dropped off #### at the front desk.
- **Filled:** 10:00 AM: Maintenance John dropped off a rent check at the front desk for unit (234).

### Asked desk to contact a resident

- **Empty:** 10:00 AM: Maintenance requested that the resident of unit (####) be contacted regarding ####.
- **Filled:** 10:00 AM: Maintenance John requested that the resident of unit (234) be contacted regarding ####.

### Asked desk to assist an arrival

- **Empty:** 10:00 AM: Maintenance requested that #### be assisted and given vendor keys on arrival.
- **Filled:** 10:00 AM: Maintenance John requested that #### be assisted and given vendor keys on arrival for unit (234).

## Leasing Office

### Staff arrived

- **Empty:** 10:00 AM: Leasing office staff arrived regarding ####.
- **Filled:** 10:00 AM: Leasing office staff John arrived regarding a maintenance follow-up.

### Dropped something off

- **Empty:** 10:00 AM: Leasing office staff dropped off #### at the front desk. (stored ####)
- **Filled:** 10:00 AM: Leasing office staff John dropped off a rent check at the front desk for unit (234). (stored by desk cabinet)

### Picked something up

- **Empty:** 10:00 AM: Leasing office staff picked up #### from the front desk.
- **Filled:** 10:00 AM: Leasing office staff John picked up a rent check from the front desk.

### Asked desk to contact a resident

- **Empty:** 10:00 AM: Leasing office staff requested that the resident of unit (####) be contacted regarding ####.
- **Filled:** 10:00 AM: Leasing office staff John requested that the resident of unit (234) be contacted regarding ####.

### Asked desk to assist an arrival

- **Empty:** 10:00 AM: Leasing office staff requested that #### be assisted on arrival.
- **Filled:** 10:00 AM: Leasing office staff John requested that #### be assisted on arrival for unit (234).

## Prospect

### Tour

- **Empty:** 10:00 AM: Prospect walked in for a tour; ####.
- **Filled:** 10:00 AM: Prospect John walked in for a tour; a member of the leasing team came down to assist.

### Availability inquiry

- **Empty:** 10:00 AM: Prospect came to the front desk to ask about availability; ####.
- **Filled:** 10:00 AM: Prospect John came to the front desk to ask about availability; a member of the leasing team came down to assist.

## Package

### Delivered packages

- **Empty:** 10:00 AM: #### delivered packages to the front desk.
- **Filled:** 10:00 AM: Amazon delivered packages to the front desk.

### Package for a unit

- **Empty:** 10:00 AM: #### delivered a package for unit (####) to the front desk.
- **Filled:** 10:00 AM: Amazon delivered a package for unit (234) to the front desk; the resident was reached and notified.

### Picked up returns

- **Empty:** 10:00 AM: #### picked up returns from the front desk.
- **Filled:** 10:00 AM: Amazon picked up returns from the front desk.

### Report something

- **Empty:** 10:00 AM: #### came to the front desk to report that ####.
- **Filled:** 10:00 AM: Amazon came to the front desk to report that their kitchen sink is leaking.

## Concierge

### On break

- **Empty:** 10:00 AM: Concierge went on break.
- **Filled:** 10:00 AM: Concierge John went on break.

### Back from break

- **Empty:** 10:00 AM: Concierge returned from break.
- **Filled:** 10:00 AM: Concierge John returned from break; the security cameras were reviewed and no suspicious activity was observed.

### Contacted resident

- **Empty:** 10:00 AM: Concierge contacted the resident in unit (####) regarding ####; ####.
- **Filled:** 10:00 AM: Concierge John contacted the resident in unit (234) regarding ####; the resident was reached and notified.

### Sorted/processed packages

- **Empty:** 10:00 AM: Concierge sorted and processed packages in the package room while maintaining visibility at the front desk.
- **Filled:** 10:00 AM: Concierge John sorted and processed packages in the package room while maintaining visibility at the front desk.

### Cleaned up / made safe

- **Empty:** 10:00 AM: Concierge addressed #### at ####. ####
- **Filled:** 10:00 AM: Concierge John addressed #### at ####. Caution Wet Floor signage was placed.

### Holding the desk

- **Empty:** 10:00 AM: Concierge remained at the front desk.
- **Filled:** 10:00 AM: Concierge John remained at the front desk; no activity in the lobby.

### Reviewed cameras

- **Empty:** 10:00 AM: Concierge reviewed the security cameras; ####.
- **Filled:** 10:00 AM: Concierge John reviewed the security cameras; no suspicious activity was observed.

## Pilgrim Parking

### Report something

- **Empty:** 10:00 AM: Pilgrim Parking staff came to the front desk to report that ####.
- **Filled:** 10:00 AM: Pilgrim Parking staff John came to the front desk to report that their kitchen sink is leaking.

### Resident parking inquiry

- **Empty:** 10:00 AM: Resident of unit (####) inquired about ####; ####.
- **Filled:** 10:00 AM: Resident of unit (234) inquired about overnight parking; the resident was advised the concierge would follow up once parking guidance is confirmed.

### Drop something off

- **Empty:** 10:00 AM: Pilgrim Parking staff dropped off #### at the front desk. (stored ####)
- **Filled:** 10:00 AM: Pilgrim Parking staff John dropped off a rent check at the front desk for unit (234). (stored by desk cabinet)

### Towing / violation

- **Empty:** 10:00 AM: A #### with #### plate #### was ####.
- **Filled:** 10:00 AM: A #### with #### plate #### was tagged for a parking violation.

