// Roles, role-level fields, and reason templates.
//
// Each role has an optional `fields` array of role-level form fields the
// popup renders before the reason dropdown. Each reason owns its full
// sentence `template` (placeholders like `{key}`) plus an optional
// `fields` array of reason-level fields.
//
// Template syntax used by sentence-builder.js:
//   {key}            substitute fieldValues[key], or render a #### blank
//   [text {key} text]  optional segment — included only when {key} (and
//                      every other field referenced inside) is non-empty
//
// The builder auto-prepends a current-time prefix ("HH:MMAM: ") to every
// rendered template, so reasons should NOT include `{time}` themselves.
//
// Field schema:
//   { key, label, kind: "text" | "select" | "radio" | "date",
//     optional?, placeholder?, default?,
//     options?: Array<string | { value, label }> }

// ─────────────────────────────────────────────────────────────────────
// SITE PROFILE — the Benjamin build.
//
// What differs from the ORA build:
//   - SITE_NAME, just below
//   - SITE_TOUR_AREAS, near the bottom of this file
//   - no parking role: Benjamin's desk has no parking company to deal
//     with, so the twelve remaining roles are all front-desk work that
//     is identical at both buildings
//
// Nothing else here is building-specific, so a fix made to a role or a
// reason in the ORA build can be copied across verbatim.
// ─────────────────────────────────────────────────────────────────────

// Heads the shift-log skeleton the Begin shift chip writes.
const SITE_NAME = "Benjamin";

const CONTACT_FIELD = {
  key: "contact",
  label: "Contact",
  kind: "select",
  default: "came to the front desk",
  options: [
    { value: "came to the front desk", label: "Came to front desk" },
    { value: "called in", label: "Called in" },
  ],
};

const NAME_FIELD = {
  key: "name",
  label: "Name",
  kind: "text",
  optional: true,
  placeholder: "(optional)",
};

// Service visitors often arrive on behalf of a company, and it may be a
// different person from that company each visit — the log needs to be able
// to name both, or either alone.
const COMPANY_FIELD = {
  key: "company",
  label: "Company",
  kind: "text",
  optional: true,
  placeholder: "(optional)",
};

const UNIT_FIELD = {
  key: "unit",
  label: "Unit #",
  kind: "text",
  placeholder: "1204",
};

// Shared service-role outcome radios (Dog Walker / Cleaner).
const SERVICE_SENT_UP_OUTCOME = {
  key: "outcome",
  label: "Outcome",
  kind: "radio",
  options: [
    {
      value: "sent up after resident confirmation via call",
      label: "Sent up — call confirmation",
    },
    {
      value: "sent up after checking the resident visitor list",
      label: "Sent up — visitor list",
    },
    {
      // Authorisation already happened when the resident asked, so nothing
      // is confirmed afresh at the desk.
      value: "sent up as per the resident's earlier request",
      label: "Sent up — earlier request",
    },
    {
      value: "denied entry, failed to confirm with resident",
      label: "Denied — couldn't reach",
    },
  ],
};

const SERVICE_KEYS_OUTCOME = {
  key: "outcome",
  label: "Outcome",
  kind: "radio",
  options: [
    {
      value: "confirmed with the resident via call, keys exchanged for an ID",
      label: "Granted — call confirmation",
      issuesKeys: true,
    },
    {
      value:
        "confirmed on the resident visitor list, keys exchanged for an ID",
      label: "Granted — visitor list",
      issuesKeys: true,
    },
    {
      value: "denied, failed to confirm with resident",
      label: "Denied — couldn't reach",
    },
  ],
};

// Vendors are let in by whoever has authority over the space, which may be
// the resident or the leasing / maintenance team — unlike a dog walker or
// cleaner, who are always there for a specific resident.
const VENDOR_KEYS_OUTCOME = {
  key: "outcome",
  label: "Outcome",
  kind: "radio",
  options: [
    {
      value: "confirmed with the resident via call, keys exchanged for an ID",
      label: "Granted — resident confirmed",
      issuesKeys: true,
    },
    {
      value:
        "confirmed with the leasing/maintenance team, keys exchanged for an ID",
      label: "Granted — leasing/maintenance",
      issuesKeys: true,
    },
    {
      value:
        "denied, failed to confirm with the resident or the leasing/maintenance team",
      label: "Denied — couldn't confirm",
    },
  ],
};

// A vendor may be working on a unit or on a shared part of the building —
// the pool, the entrance doors, the elevators — so the target is picked
// first and only the matching field is shown.
const VENDOR_FOR_FIELD = {
  key: "forWhat",
  label: "For",
  kind: "select",
  default: "unit",
  options: [
    { value: "unit", label: "A unit" },
    { value: "area", label: "Building / amenity" },
  ],
};

const VENDOR_UNIT_FIELD = {
  ...UNIT_FIELD,
  showWhen: { key: "forWhat", value: "unit" },
};

const VENDOR_AREA_FIELD = {
  key: "area",
  label: "Area",
  kind: "text",
  // The template supplies "the", so a bare noun phrase is what's wanted.
  placeholder: "pool area",
  showWhen: { key: "forWhat", value: "area" },
};

// Letting a vendor in is authorised the same way handing them keys is, but
// nothing is exchanged, so the wording is about access rather than an ID.
const VENDOR_ACCESS_OUTCOME = {
  key: "outcome",
  label: "Outcome",
  kind: "radio",
  options: [
    {
      value: "access granted after resident confirmation via call",
      label: "Granted — resident confirmed",
    },
    {
      value:
        "access granted after confirming with the leasing/maintenance team",
      label: "Granted — leasing/maintenance",
    },
    {
      value:
        "access denied, failed to confirm with the resident or the leasing/maintenance team",
      label: "Denied — couldn't confirm",
    },
  ],
};

// What actually became of a prospect. Every reason used to end "the
// leasing team was informed", which is false whenever leasing is closed or
// nobody picks up — precisely the case the next shift needs to know about.
const PROSPECT_OUTCOME = {
  key: "outcome",
  label: "Outcome",
  kind: "select",
  options: [
    {
      value: "a member of the leasing team came down to assist",
      label: "Leasing came down",
    },
    {
      value: "the leasing team was informed for follow-up",
      label: "Leasing informed",
    },
    {
      value: "the prospect was directed to the leasing office",
      label: "Sent to leasing office",
    },
    {
      value:
        "the leasing team could not be reached and the prospect's details were taken for follow-up",
      label: "No reach — details taken",
    },
    {
      value: "the leasing team could not be reached and the prospect left",
      label: "No reach — prospect left",
    },
  ],
};

// Someone at the desk asking for leasing, when leasing may or may not be
// reachable. Kept apart from the prospect wording, which names a prospect.
const LEASING_REQUEST_OUTCOME = {
  key: "outcome",
  label: "Outcome",
  kind: "select",
  options: [
    {
      value: "a member of the leasing team came down to assist",
      label: "Leasing came down",
    },
    {
      value: "the leasing team was informed for follow-up",
      label: "Leasing informed",
    },
    { value: "they were directed to the leasing office", label: "Sent to office" },
    {
      value:
        "the leasing team could not be reached and their details were taken for follow-up",
      label: "No reach — details taken",
    },
  ],
};

// Opening a unit with the master key is a different act from lending a key
// out: nothing leaves the desk, so nothing is held against it and there is
// nothing to return.
const MASTER_KEY_CONFIRM = {
  key: "confirmation",
  label: "Confirmed by",
  kind: "radio",
  options: [
    { value: "resident confirmation via call", label: "Call confirmation" },
    {
      value: "checking the resident visitor list",
      label: "Visitor list",
    },
  ],
};

// Courier picker for the Package role. "Other" is a sentinel: picking it
// reveals COURIER_OTHER_FIELD, whose `replaces` hands its typed value back
// to {courier} so every template references only {courier}.
const COURIER_FIELD = {
  key: "courier",
  label: "Courier",
  kind: "select",
  options: [
    "Amazon",
    "UPS",
    "FedEx",
    "USPS",
    "DHL",
    "OnTrac",
    "Veho",
    "Other",
  ],
};

const COURIER_OTHER_FIELD = {
  key: "courierOther",
  label: "Courier name",
  kind: "text",
  placeholder: "Courier name",
  replaces: "courier",
  showWhen: { key: "courier", value: "Other" },
};

// Where something handed to the desk ends up. Shared by every reason that
// takes custody of an item, so the log names the same four places each time.
const STORAGE_FIELD = {
  key: "storage",
  label: "Stored",
  kind: "select",
  options: [
    { value: "by desk cabinet", label: "Desk cabinet" },
    { value: "by key lock box", label: "Key lock box" },
    { value: "inside package room", label: "Package room" },
    { value: "in keytrack", label: "Keytrack" },
  ],
};

// How an attempt to reach a resident actually went. Whether they picked up
// is the whole point of the entry, so it can't be left implied.
const CONTACT_OUTCOME = {
  key: "outcome",
  label: "Outcome",
  kind: "radio",
  options: [
    {
      value: "the resident was reached and notified",
      label: "Reached & notified",
    },
    {
      value:
        "the resident was reached and advised they would retrieve it shortly",
      label: "Will retrieve shortly",
    },
    {
      value: "there was no answer and a voicemail was left",
      label: "No answer — voicemail",
    },
    { value: "there was no answer", label: "No answer" },
  ],
};

// What someone leaves at the desk for another person. Values carry their
// own article so the sentence reads right whichever one is picked.
const DROP_ITEM_FIELD = {
  key: "item",
  label: "Item",
  kind: "select",
  default: "keys",
  options: [
    { value: "keys", label: "Keys" },
    { value: "an envelope", label: "Envelope" },
    { value: "a package", label: "Package" },
    { value: "a bag", label: "Bag" },
    { value: "a parking pass", label: "Parking pass" },
    { value: "Other", label: "Other…" },
  ],
};

const DROP_ITEM_OTHER_FIELD = {
  key: "itemOther",
  label: "Item",
  kind: "text",
  // Carries its own article, like the options above.
  placeholder: "a garment bag",
  replaces: "item",
  showWhen: { key: "item", value: "Other" },
};

// Which service delivered. Same sentinel pattern as the courier picker:
// "Other" reveals a free-text box that supplies {app} instead.
const APP_FIELD = {
  key: "app",
  label: "App / service",
  kind: "select",
  options: [
    "DoorDash",
    "Uber Eats",
    "Grubhub",
    "Instacart",
    "Amazon Fresh",
    "Walmart",
    "Target",
    "CVS",
    "Other",
  ],
};

const APP_OTHER_FIELD = {
  key: "appOther",
  label: "Service name",
  kind: "text",
  placeholder: "Service name",
  replaces: "app",
  showWhen: { key: "app", value: "Other" },
};

// Where a delivery is held. Values read correctly after both "awaiting
// pick-up …" and "was stored …".
const DELIVERY_STORAGE = {
  key: "storage",
  label: "Held",
  kind: "select",
  default: "at the front desk",
  options: [
    { value: "at the front desk", label: "Front desk" },
    { value: "in the fridge", label: "Fridge" },
    { value: "in the package room", label: "Package room" },
  ],
};

const OPTIONAL_UNIT_FIELD = {
  ...UNIT_FIELD,
  optional: true,
  placeholder: "(optional)",
};

// Benjamin's loading dock is reserved ahead of time and then set up when
// the slot comes round — two log entries, hours or days apart, sharing the
// same two facts. Required on the booking, where the slot is the point of
// the entry; optional on the setup, where the timestamp already says when
// and the slot is only a cross-reference back to the booking.
const DOCK_SLOT_FIELD = {
  key: "slot",
  label: "Time slot",
  kind: "text",
  placeholder: "9:00 AM – 12:00 PM",
};

const OPTIONAL_DOCK_SLOT_FIELD = {
  ...DOCK_SLOT_FIELD,
  optional: true,
  placeholder: "(optional)",
};

// Why the dock is wanted. A move is only one of the reasons — furniture
// deliveries are the ordinary case — so nothing here is assumed and
// "Other" opens a free-text box for anything the list misses.
const DOCK_PURPOSE_FIELD = {
  key: "purpose",
  label: "For",
  kind: "select",
  optional: true,
  placeholder: "(not stated)",
  options: [
    { value: "a furniture delivery", label: "Furniture delivery" },
    { value: "a large delivery", label: "Large delivery" },
    { value: "a move-in", label: "Move-in" },
    { value: "a move-out", label: "Move-out" },
    { value: "a contractor", label: "Contractor" },
    { value: "Other", label: "Other…" },
  ],
};

const DOCK_PURPOSE_OTHER_FIELD = {
  key: "purposeOther",
  label: "For",
  kind: "text",
  // Carries its own article, like the options above.
  placeholder: "an appliance swap",
  replaces: "purpose",
  showWhen: { key: "purpose", value: "Other" },
};

// The staff manual, opened by the Guide button in the popup. Empty string
// hides the button.
export const MANUAL_URL =
  "https://claude.ai/code/artifact/9048cc3e-0bc0-487e-bf3f-82b3c0ae27d9";

export const HELPER = {
  defaultRoleId: "resident",
  roles: [
    {
      id: "resident",
      label: "Resident",
      fields: [NAME_FIELD, UNIT_FIELD, CONTACT_FIELD],
      reasons: [
        {
          id: "dropKeys",
          label: "Drop off for pickup",
          template:
            "Resident[ {name}] from unit ({unit}) {contact} to drop {item} for {recipient} to pick-up later. (stored {storage})",
          fields: [
            DROP_ITEM_FIELD,
            DROP_ITEM_OTHER_FIELD,
            { key: "recipient", label: "Drop for (name)", kind: "text" },
            STORAGE_FIELD,
          ],
        },
        {
          id: "pickupKeys",
          label: "Pick up something left for them",
          template:
            "Resident[ {name}] from unit ({unit}) {contact} to pick up {item} left for them after identification was confirmed.",
          fields: [DROP_ITEM_FIELD, DROP_ITEM_OTHER_FIELD],
        },
        {
          id: "report",
          label: "Report something",
          template:
            "Resident[ {name}] from unit ({unit}) {contact} to report that {description}.[ The report concerns unit ({aboutUnit}).][ {action}]",
          fields: [
            { key: "description", label: "Report details", kind: "text" },
            {
              key: "aboutUnit",
              label: "About unit #",
              kind: "text",
              optional: true,
              placeholder: "(optional)",
            },
            {
              // A concierge cannot raise a maintenance request. The most
              // that can be done is hand over the contact details and let
              // the resident make the call themselves.
              key: "action",
              label: "Action taken",
              kind: "select",
              optional: true,
              placeholder: "(none)",
              options: [
                {
                  value:
                    "Emergency Maintenance contact information was provided for the resident to call directly, and the resident was advised same-evening response could not be guaranteed.",
                  label: "Emergency contact given",
                },
                {
                  value:
                    "Emergency Maintenance contact information was provided for the resident to call directly.",
                  label: "Emergency contact given (short)",
                },
                {
                  value: "The maintenance team will be notified for follow-up.",
                  label: "Flagged for maintenance",
                },
                {
                  value: "The leasing office will be notified for follow-up.",
                  label: "Flagged for leasing",
                },
              ],
            },
          ],
        },
        {
          id: "missingPackage",
          label: "Missing package",
          template:
            "Resident[ {name}] from unit ({unit}) {contact} to inquire about a missing package from {courier} that was delivered on {deliveredDate}.",
          fields: [
            COURIER_FIELD,
            COURIER_OTHER_FIELD,
            { key: "deliveredDate", label: "Delivered on", kind: "date" },
          ],
        },
        {
          id: "lockout",
          label: "Unit lockout",
          template:
            "Resident[ {name}] from unit ({unit}) {contact} to request entry into their unit because they forgot their keys.",
        },
        {
          id: "grabbedDolly",
          label: "Grabbed dolly",
          tracksOut: { dir: "out", kind: "a dolly" },
          template:
            "Resident[ {name}] from unit ({unit}) {contact} to grab a dolly; the concierge assisted after confirmation.",
        },
        {
          // The desk books the dock itself, so the only outcomes are that
          // the slot was taken or that it was already gone.
          id: "bookedDock",
          label: "Book the loading dock",
          template:
            "Resident[ {name}] from unit ({unit}) {contact} to book the loading dock for {bookingDate}, {slot}[, for {purpose}]; {outcome}.",
          fields: [
            { key: "bookingDate", label: "Date", kind: "date" },
            DOCK_SLOT_FIELD,
            DOCK_PURPOSE_FIELD,
            DOCK_PURPOSE_OTHER_FIELD,
            {
              key: "outcome",
              label: "Outcome",
              kind: "select",
              options: [
                {
                  value: "the loading dock was reserved for that time",
                  label: "Reserved",
                },
                {
                  value:
                    "the slot was already reserved and the resident was asked to pick another time",
                  label: "Slot already taken",
                },
              ],
            },
          ],
        },
        {
          id: "elevatorAccess",
          label: "Request elevator access",
          template:
            "Resident[ {name}] from unit ({unit}) {contact} to request elevator access; access was granted after confirmation.",
        },
        {
          id: "pickedUpPackages",
          label: "Picked up packages",
          template:
            "Resident[ {name}] from unit ({unit}) {contact} to pick up packages.",
        },
        {
          id: "sendUpGuest",
          label: "Send a guest up",
          template:
            "Resident[ {name}] from unit ({unit}) {contact} to request that guest {guestName} be sent up.",
          fields: [{ key: "guestName", label: "Guest name", kind: "text" }],
        },
        {
          id: "returnedDolly",
          label: "Returned dolly",
          tracksOut: { dir: "in", kind: "a dolly" },
          template:
            "Resident[ {name}] from unit ({unit}) returned the dolly to the front desk.",
        },
        {
          id: "askedLeasing",
          label: "Asked to speak with leasing",
          template:
            "Resident[ {name}] from unit ({unit}) {contact} to speak with the leasing office[ regarding {purpose}]; {outcome}.",
          fields: [
            {
              key: "purpose",
              label: "Regarding",
              kind: "text",
              optional: true,
              placeholder: "(optional)",
            },
            LEASING_REQUEST_OUTCOME,
          ],
        },
      ],
    },
    {
      id: "guest",
      label: "Guest",
      fields: [
        NAME_FIELD,
        UNIT_FIELD,
        {
          key: "residentName",
          label: "Resident name",
          kind: "text",
          optional: true,
          placeholder: "(optional)",
        },
        CONTACT_FIELD,
      ],
      reasons: [
        {
          id: "visitResident",
          label: "Visit resident",
          template:
            "Guest[ {name}] of unit ({unit}[ {residentName}]) {contact} to visit resident, elevator access {outcome}.",
          fields: [
            {
              key: "outcome",
              label: "Outcome",
              kind: "radio",
              options: [
                {
                  value: "granted after resident confirmation via call",
                  label: "Granted — call confirmation",
                },
                {
                  value: "granted after checking the resident guest list",
                  label: "Granted — guest list",
                },
                {
                  value: "denied after failing to reach resident",
                  label: "Denied — couldn't reach",
                },
              ],
            },
          ],
        },
        {
          id: "pickupKeys",
          label: "Pick up something left for them",
          template:
            "Guest[ {name}] of unit ({unit}[ {residentName}]) {contact} to pick up {item} left for them after identification was confirmed.",
          fields: [DROP_ITEM_FIELD, DROP_ITEM_OTHER_FIELD],
        },
        {
          id: "dropKeys",
          label: "Drop off for pickup",
          template:
            "Guest[ {name}] of unit ({unit}[ {residentName}]) {contact} to drop {item} for {recipient}. (stored {storage})",
          fields: [
            DROP_ITEM_FIELD,
            DROP_ITEM_OTHER_FIELD,
            { key: "recipient", label: "Drop for (name)", kind: "text" },
            STORAGE_FIELD,
          ],
        },
        {
          id: "givenKeys",
          tracksOut: { dir: "out", kind: "unit keys" },
          label: "Given unit keys",
          template:
            "Guest[ {name}] {contact} for unit ({unit}[ {residentName}]) and requested unit keys; {outcome}.",
          fields: [SERVICE_KEYS_OUTCOME],
        },
        {
          id: "returnedKeys",
          tracksOut: { dir: "in" },
          label: "Returned unit keys",
          template:
            "Guest[ {name}] returned the unit keys for unit ({unit}[ {residentName}]) to the front desk and their ID was handed back.",
        },
        {
          id: "sentUpPerRequest",
          label: "Sent up — per earlier request",
          // The arrival half of the resident's ;re9 request, where the
          // authorisation already happened and needs no fresh confirmation.
          template:
            "Guest[ {name}] of unit ({unit}[ {residentName}]) {contact} and was sent up as per the resident's earlier request.",
        },
      ],
    },
    {
      id: "appDelivery",
      label: "App delivery",
      fields: [APP_FIELD, APP_OTHER_FIELD, UNIT_FIELD],
      reasons: [
        {
          id: "delivered",
          label: "Delivered — awaiting pickup",
          template:
            "App delivery from {app} for unit ({unit}) was delivered and is awaiting pick-up {storage}; {outcome}.",
          fields: [DELIVERY_STORAGE, CONTACT_OUTCOME],
        },
        {
          id: "lobby30",
          label: "Not picked up >30 min — stored",
          // Neither the outcome nor the storage place can be assumed here:
          // a delivery usually sits thirty minutes precisely because the
          // resident could not be reached, and only food belongs in a fridge.
          template:
            "App delivery from {app} for unit ({unit}) has not been picked-up for more than 30 minutes; {outcome}. The delivery was stored {storage}.",
          fields: [DELIVERY_STORAGE, CONTACT_OUTCOME],
        },
        {
          id: "collected",
          label: "Collected by resident",
          template:
            "App delivery from {app} for unit ({unit}) was collected from the front desk.",
        },
        {
          id: "notHeld",
          label: "Sent up / left at door",
          template:
            "App delivery from {app} for unit ({unit}) was {disposition}.",
          fields: [
            {
              key: "disposition",
              label: "Disposition",
              kind: "radio",
              options: [
                {
                  value: "sent up to the unit after resident confirmation",
                  label: "Sent up — confirmed",
                },
                {
                  value: "left at the unit door by the driver",
                  label: "Left at door",
                },
                {
                  value: "handed to the resident in the lobby",
                  label: "Handed in lobby",
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "dogWalker",
      label: "Dog Walker",
      fields: [NAME_FIELD, COMPANY_FIELD, UNIT_FIELD],
      reasons: [
        {
          id: "sentUp",
          label: "Sent up",
          template:
            "Dog walker[ {name}][ from {company}] arrived for unit ({unit}); {outcome}.",
          fields: [SERVICE_SENT_UP_OUTCOME],
        },
        {
          id: "pickedUpKeys",
          tracksOut: { dir: "out", kind: "unit keys" },
          label: "Picked up unit keys",
          template:
            "Dog walker[ {name}][ from {company}] arrived for unit ({unit}) and requested unit keys; {outcome}.",
          fields: [SERVICE_KEYS_OUTCOME],
        },
        {
          id: "returnedKeys",
          tracksOut: { dir: "in" },
          label: "Returned unit keys",
          template:
            "Dog walker[ {name}][ from {company}] returned the unit keys for unit ({unit}) to the front desk and their ID was handed back.",
        },
        {
          // Keys the resident owns and left at the desk are never coming
          // back to us, so no ID is held against them — only the collector's
          // identity is checked. Building keys are the opposite case.
          id: "residentLeftKeys",
          label: "Picked up keys left by resident",
          template:
            "Dog walker[ {name}][ from {company}] picked up the keys left for them by the resident of unit ({unit}); identification confirmed, no ID held.",
        },
        {
          id: "masterKeyEntry",
          label: "Let in with master key",
          template:
            "Dog walker[ {name}][ from {company}] arrived for unit ({unit}); no spare key was available, so the concierge used the master key to open the unit after {confirmation}.",
          fields: [MASTER_KEY_CONFIRM],
        },
      ],
    },
    {
      id: "cleaner",
      label: "Cleaner",
      fields: [NAME_FIELD, COMPANY_FIELD, UNIT_FIELD],
      reasons: [
        {
          id: "sentUp",
          label: "Sent up",
          template: "Cleaner[ {name}][ from {company}] arrived for unit ({unit}); {outcome}.",
          fields: [SERVICE_SENT_UP_OUTCOME],
        },
        {
          id: "pickedUpKeys",
          tracksOut: { dir: "out", kind: "unit keys" },
          label: "Picked up unit keys",
          template:
            "Cleaner[ {name}][ from {company}] arrived for unit ({unit}) and requested unit keys; {outcome}.",
          fields: [SERVICE_KEYS_OUTCOME],
        },
        {
          id: "returnedKeys",
          tracksOut: { dir: "in" },
          label: "Returned unit keys",
          template:
            "Cleaner[ {name}][ from {company}] returned the unit keys for unit ({unit}) to the front desk and their ID was handed back.",
        },
        {
          // Keys the resident owns and left at the desk are never coming
          // back to us, so no ID is held against them — only the collector's
          // identity is checked. Building keys are the opposite case.
          id: "residentLeftKeys",
          label: "Picked up keys left by resident",
          template:
            "Cleaner[ {name}][ from {company}] picked up the keys left for them by the resident of unit ({unit}); identification confirmed, no ID held.",
        },
        {
          id: "masterKeyEntry",
          label: "Let in with master key",
          template:
            "Cleaner[ {name}][ from {company}] arrived for unit ({unit}); no spare key was available, so the concierge used the master key to open the unit after {confirmation}.",
          fields: [MASTER_KEY_CONFIRM],
        },
      ],
    },
    {
      id: "vendor",
      label: "Vendor",
      fields: [
        NAME_FIELD,
        COMPANY_FIELD,
        VENDOR_FOR_FIELD,
        VENDOR_UNIT_FIELD,
        VENDOR_AREA_FIELD,
      ],
      reasons: [
        {
          // Vendor keys are ours and have to come back, so an ID is always
          // held against them.
          id: "pickedUpKeys",
          tracksOut: { dir: "out", kind: "vendor keys" },
          label: "Picked up vendor keys",
          template:
            "Vendor[ {name}][ from {company}] requested vendor keys[ for unit ({unit})][ for the {area}][ regarding {purpose}]; {outcome}.",
          fields: [
            {
              key: "purpose",
              label: "Regarding",
              kind: "text",
              optional: true,
              placeholder: "(optional)",
            },
            VENDOR_KEYS_OUTCOME,
          ],
        },
        {
          id: "returnedKeys",
          tracksOut: { dir: "in" },
          label: "Returned vendor keys",
          template:
            "Vendor[ {name}][ from {company}] returned the vendor keys[ for unit ({unit})][ for the {area}] to the front desk and their ID was handed back.",
        },
        {
          // Plenty of vendors need no keys at all — a technician working on
          // the boiler or the entrance doors is let in and that is the whole
          // entry.
          id: "arrived",
          label: "Arrived / sent up",
          template:
            "Vendor[ {name}][ from {company}] arrived[ for unit ({unit})][ for the {area}][ regarding {purpose}]; {outcome}.",
          fields: [
            {
              key: "purpose",
              label: "Regarding",
              kind: "text",
              optional: true,
              placeholder: "(optional)",
            },
            VENDOR_ACCESS_OUTCOME,
          ],
        },
        {
          id: "askedLeasing",
          label: "Asked to speak with leasing",
          template:
            "Vendor[ {name}][ from {company}] asked to speak with the leasing office[ regarding {purpose}]; {outcome}.",
          fields: [
            {
              key: "purpose",
              label: "Regarding",
              kind: "text",
              optional: true,
              placeholder: "(optional)",
            },
            LEASING_REQUEST_OUTCOME,
          ],
        },
      ],
    },
    {
      id: "item",
      label: "Item / property",
      // Only the two cases the Resident and Guest reasons can't express:
      // something left for its owner rather than for another person, and
      // property found by someone with no connection to it.
      fields: [NAME_FIELD, OPTIONAL_UNIT_FIELD],
      reasons: [
        {
          id: "leftForStorage",
          label: "Left for storage",
          template:
            "Resident[ {name}] of unit ({unit}) left {item} at the front desk to collect later. Stored {storage}.",
          fields: [DROP_ITEM_FIELD, DROP_ITEM_OTHER_FIELD, STORAGE_FIELD],
        },
        {
          id: "found",
          label: "Found property",
          // Led with "Property turned in" rather than the item, because the
          // item values carry lower-case articles and would otherwise open
          // the sentence as "a key fob was found …".
          template:
            "Property turned in to the front desk: {item}, found at {location}. {disposition}",
          fields: [
            { key: "item", label: "Item", kind: "text", placeholder: "a key fob" },
            { key: "location", label: "Found at", kind: "text" },
            {
              key: "disposition",
              label: "Disposition",
              kind: "select",
              options: [
                {
                  value: "Marked unknown and left at the leasing office.",
                  label: "Left at leasing office",
                },
                {
                  value: "Secured at the front desk pending claim.",
                  label: "Held at desk",
                },
                { value: "Returned to the owner.", label: "Returned to owner" },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "maintenance",
      label: "Maintenance",
      // What the maintenance team does at the desk. A resident reporting a
      // problem is logged on the Resident report reason instead — there is
      // no separate maintenance-request event, because a concierge cannot
      // raise one.
      fields: [NAME_FIELD],
      reasons: [
        {
          id: "onSite",
          label: "On site",
          template:
            "Maintenance[ {name}] arrived on site[ for unit ({unit})] regarding {issue}.",
          fields: [
            OPTIONAL_UNIT_FIELD,
            { key: "issue", label: "Regarding", kind: "text" },
          ],
        },
        {
          id: "droppedOff",
          label: "Dropped something off",
          template:
            "Maintenance[ {name}] dropped off {item} at the front desk[ for unit ({unit})].",
          fields: [
            { key: "item", label: "Item", kind: "text", placeholder: "a work order" },
            OPTIONAL_UNIT_FIELD,
          ],
        },
        {
          id: "askedContact",
          label: "Asked desk to contact a resident",
          template:
            "Maintenance[ {name}] requested that the resident of unit ({unit}) be contacted regarding {message}.",
          fields: [
            UNIT_FIELD,
            { key: "message", label: "Regarding", kind: "text" },
          ],
        },
        {
          id: "askedAccess",
          label: "Asked desk to assist an arrival",
          // Maintenance arranging for a contractor the desk will meet later,
          // so the desk knows in advance who is expected and what to give.
          template:
            "Maintenance[ {name}] requested that {who} be {assistance}[ for unit ({unit})][ regarding {purpose}].",
          fields: [
            { key: "who", label: "Who is expected", kind: "text", placeholder: "Otis Elevator" },
            {
              key: "assistance",
              label: "Assistance",
              kind: "select",
              default: "assisted and given vendor keys on arrival",
              options: [
                {
                  value: "assisted and given vendor keys on arrival",
                  label: "Assist + vendor keys",
                },
                { value: "assisted on arrival", label: "Assist only" },
                {
                  value: "given vendor keys on arrival",
                  label: "Vendor keys only",
                },
              ],
            },
            OPTIONAL_UNIT_FIELD,
            {
              key: "purpose",
              label: "Regarding",
              kind: "text",
              optional: true,
              placeholder: "(optional)",
            },
          ],
        },
      ],
    },
    {
      id: "leasingOffice",
      label: "Leasing Office",
      fields: [NAME_FIELD],
      reasons: [
        {
          id: "arrived",
          label: "Staff arrived",
          template:
            "Leasing office staff[ {name}] arrived regarding {subject}.",
          fields: [{ key: "subject", label: "Regarding", kind: "text" }],
        },
        {
          id: "dropOff",
          label: "Dropped something off",
          // Leasing leaves plenty at the desk that belongs to no unit —
          // signage, forms, supplies — so the unit is optional, and where it
          // was put is recorded like every other item the desk takes in.
          template:
            "Leasing office staff[ {name}] dropped off {item} at the front desk[ for unit ({unit})]. (stored {storage})",
          fields: [
            { key: "item", label: "Item", kind: "text" },
            OPTIONAL_UNIT_FIELD,
            STORAGE_FIELD,
          ],
        },
        {
          id: "pickup",
          label: "Picked something up",
          template:
            "Leasing office staff[ {name}] picked up {item} from the front desk.",
          fields: [{ key: "item", label: "Item", kind: "text" }],
        },
        {
          id: "askedContact",
          label: "Asked desk to contact a resident",
          template:
            "Leasing office staff[ {name}] requested that the resident of unit ({unit}) be contacted regarding {message}.",
          fields: [
            UNIT_FIELD,
            { key: "message", label: "Regarding", kind: "text" },
          ],
        },
        {
          id: "askedAssist",
          label: "Asked desk to assist an arrival",
          // Leasing coordinates through the desk constantly — a prospect due
          // for a tour, a new resident collecting keys — and the desk needs
          // that written down before the person turns up.
          template:
            "Leasing office staff[ {name}] requested that {who} be {assistance}[ for unit ({unit})][ regarding {purpose}].",
          fields: [
            { key: "who", label: "Who is expected", kind: "text" },
            {
              key: "assistance",
              label: "Assistance",
              kind: "select",
              default: "assisted on arrival",
              options: [
                { value: "assisted on arrival", label: "Assist" },
                {
                  value: "assisted and given the keys left for them on arrival",
                  label: "Assist + keys left",
                },
                {
                  value: "directed to the leasing office on arrival",
                  label: "Send to leasing",
                },
              ],
            },
            OPTIONAL_UNIT_FIELD,
            {
              key: "purpose",
              label: "Regarding",
              kind: "text",
              optional: true,
              placeholder: "(optional)",
            },
          ],
        },
      ],
    },
    {
      id: "prospect",
      label: "Prospect",
      // The point of the role is handing someone to leasing, so it has to be
      // able to carry a way of reaching them when that handover doesn't
      // complete.
      fields: [
        NAME_FIELD,
        {
          key: "contactInfo",
          label: "Contact details",
          kind: "text",
          optional: true,
          placeholder: "(optional)",
        },
      ],
      reasons: [
        {
          // Walk-in and scheduled differed by one clause, so they are one
          // reason with a toggle rather than two near-identical entries.
          id: "tour",
          label: "Tour",
          template:
            "Prospect[ {name}] {arrival}[, contact {contactInfo}]; {outcome}.",
          fields: [
            {
              key: "arrival",
              label: "Arrival",
              kind: "radio",
              default: "walked in for a tour",
              options: [
                { value: "walked in for a tour", label: "Walk-in" },
                {
                  value:
                    "arrived for their scheduled tour with the leasing team",
                  label: "Scheduled",
                },
              ],
            },
            PROSPECT_OUTCOME,
          ],
        },
        {
          id: "availability",
          label: "Availability inquiry",
          template:
            "Prospect[ {name}] {contact} to ask about availability[, contact {contactInfo}]; {outcome}.",
          fields: [CONTACT_FIELD, PROSPECT_OUTCOME],
        },
      ],
    },
    {
      id: "package",
      label: "Package",
      fields: [COURIER_FIELD, COURIER_OTHER_FIELD],
      reasons: [
        {
          // A courier arriving and a courier delivering were two reasons for
          // one event. Merged, with room for the count that makes the entry
          // worth reading — thirty boxes is a different shift from three.
          id: "delivered",
          label: "Delivered packages",
          template:
            "{courier} delivered[ {count}] packages to the front desk.",
          fields: [
            {
              key: "count",
              label: "How many",
              kind: "text",
              optional: true,
              placeholder: "(optional)",
            },
          ],
        },
        {
          // The most ordinary courier event of all, and it had no reason:
          // one package, one unit.
          id: "forUnit",
          label: "Package for a unit",
          template:
            "{courier} delivered a package for unit ({unit}) to the front desk[; {outcome}].",
          fields: [
            UNIT_FIELD,
            {
              key: "outcome",
              label: "Resident notified",
              kind: "select",
              optional: true,
              placeholder: "(not notified)",
              options: CONTACT_OUTCOME.options,
            },
          ],
        },
        {
          id: "pickedUpReturns",
          label: "Picked up returns",
          template: "{courier} picked up[ {count}] returns from the front desk.",
          fields: [
            {
              key: "count",
              label: "How many",
              kind: "text",
              optional: true,
              placeholder: "(optional)",
            },
          ],
        },
        {
          id: "report",
          label: "Report something",
          template:
            "{courier} came to the front desk to report that {description}.",
          fields: [
            { key: "description", label: "Report details", kind: "text" },
          ],
        },
      ],
    },
    {
      id: "concierge",
      label: "Concierge",
      fields: [NAME_FIELD],
      reasons: [
        {
          id: "onBreak",
          label: "On break",
          template: "Concierge[ {name}] went on break.",
        },
        {
          id: "backFromBreak",
          label: "Back from break",
          template: "Concierge[ {name}] returned from break[; {check}].",
          fields: [
            {
              key: "check",
              label: "Camera check",
              kind: "select",
              optional: true,
              placeholder: "(none)",
              options: [
                {
                  value:
                    "the security cameras were reviewed and no suspicious activity was observed",
                  label: "Cameras — nothing suspicious",
                },
                {
                  value:
                    "the security cameras were reviewed and activity was observed, noted below",
                  label: "Cameras — activity observed",
                },
              ],
            },
          ],
        },
        {
          id: "contactedResident",
          label: "Contacted resident",
          // Phrased as "regarding" rather than "informed them" so the reason
          // still reads correctly when nobody picked up.
          template:
            "Concierge[ {name}] contacted the resident in unit ({unit}) regarding {message}; {outcome}.",
          fields: [
            UNIT_FIELD,
            { key: "message", label: "Regarding", kind: "text" },
            CONTACT_OUTCOME,
          ],
        },
        {
          // The desk doesn't set up against the clock — it sets up when
          // the resident says they're ready, so the entry names what
          // prompted it.
          id: "dockReady",
          label: "Loading dock readied",
          template:
            "The resident in unit ({unit}) {contact} to advise they were ready to use the loading dock[ for {purpose}]; concierge[ {name}] prepared the loading dock and elevator[ for their {slot} booking].[ {note}]",
          fields: [
            UNIT_FIELD,
            CONTACT_FIELD,
            DOCK_PURPOSE_FIELD,
            DOCK_PURPOSE_OTHER_FIELD,
            OPTIONAL_DOCK_SLOT_FIELD,
            {
              key: "note",
              label: "Note",
              kind: "text",
              optional: true,
              placeholder: "(optional)",
            },
          ],
        },
        {
          id: "packages",
          label: "Sorted/processed packages",
          template:
            "Concierge[ {name}] sorted and processed packages in the package room while maintaining visibility at the front desk.",
        },
        {
          id: "cleanup",
          label: "Cleaned up / made safe",
          template:
            "Concierge[ {name}] addressed {issue} at {location}. {precaution}",
          fields: [
            { key: "issue", label: "Issue", kind: "text" },
            { key: "location", label: "Location", kind: "text" },
            {
              key: "precaution",
              label: "Precaution",
              kind: "select",
              options: [
                {
                  value: "Caution Wet Floor signage was placed.",
                  label: "Wet floor signage",
                },
                { value: "The area was cordoned off.", label: "Cordoned off" },
                {
                  value: "No further action was required.",
                  label: "No further action",
                },
              ],
            },
          ],
        },
        {
          id: "holdingDesk",
          label: "Holding the desk",
          template: "Concierge[ {name}] remained at the front desk[; {note}].",
          fields: [
            {
              key: "note",
              label: "Note",
              kind: "select",
              optional: true,
              placeholder: "(none)",
              options: [
                { value: "no activity in the lobby", label: "No activity" },
                {
                  value: "the lobby and entrances were monitored",
                  label: "Monitoring",
                },
                { value: "resident traffic was steady", label: "Steady traffic" },
              ],
            },
          ],
        },
        {
          id: "cameras",
          label: "Reviewed cameras",
          template: "Concierge[ {name}] reviewed the security cameras; {outcome}.",
          fields: [
            {
              key: "outcome",
              label: "Outcome",
              kind: "radio",
              options: [
                {
                  value: "no suspicious activity was observed",
                  label: "Nothing suspicious",
                },
                {
                  value: "activity was observed and is noted below",
                  label: "Activity observed",
                },
              ],
            },
          ],
        },
      ],
    },
  ],
};

// Areas walked on a site tour, in walking order. Each renders a row with
// a tick box and an issue box, and every control is optional: an area left
// untouched is simply not mentioned in the log.
//
// `clear` is what ticking that area reports, on the box and in the
// sentence — most areas are just "all clear", but some have a specific
// thing the walker is confirming. `options` adds a status dropdown, and
// `people: true` adds an occupancy count box.
// Benjamin's walk route, in walking order, tagged with the floor it is
// on. Consecutive areas sharing a `floor` form one group: the form heads
// them with the floor name, and the sentence names the floor once rather
// than on every area.
//
//   { id, floor, label }              tick box + free-text issue box
//   { id, floor, label, clear }       ...with custom wording on the tick
//   { id, floor, label, options }     ...plus a status dropdown
//   { id, floor, label, people }      ...plus an occupancy count box
//
// `id` is internal (any unique string). `clear` defaults to "all clear".
// Every control is optional — an area left untouched is not mentioned.
export const SITE_TOUR_AREAS = [
  { id: "entranceVestibule", floor: "1st floor", label: "Entrance vestibule" },
  {
    id: "lobbyWaiting",
    floor: "1st floor",
    label: "Lobby waiting area",
    clear: "all clear and organized",
  },
  {
    id: "emergencyExit",
    floor: "1st floor",
    label: "Emergency exit",
    clear: "secured",
  },
  // Walked like any other area. Booking it and setting it up are separate
  // log entries under Resident and Concierge — this is just the check that
  // it is in order on the round.
  { id: "loadingDock", floor: "1st floor", label: "Loading dock" },

  { id: "sitting4", floor: "4th floor", label: "Sitting area" },
  { id: "gym", floor: "4th floor", label: "GYM" },
  { id: "conferenceRoom", floor: "4th floor", label: "Conference room" },
  { id: "kitchen", floor: "4th floor", label: "Kitchen" },
  { id: "pool", floor: "4th floor", label: "Pool area", people: true },
  { id: "grill", floor: "4th floor", label: "Grill area", people: true },
  { id: "terrace", floor: "4th floor", label: "Terrace" },
  { id: "fireplace", floor: "4th floor", label: "Fire place" },

  // The three garage levels are one group: P1 and P2 are checked as
  // levels with nothing on them to name separately, so heading each with
  // its own floor would put the same words twice on every row.
  { id: "p1", floor: "Parking", label: "P1" },
  { id: "p2", floor: "Parking", label: "P2" },
  { id: "p3", floor: "Parking", label: "P3" },
  { id: "dogWash", floor: "Parking", label: "Dog wash", clear: "clean" },
];

// Concierge shifts as [start, end) hours on a 24h clock. The hours are
// stored rather than parsed back out of the label because the overnight
// shift wraps midnight, which a label alone can't express.
const SHIFTS = [
  { value: "7am-3pm", start: 7, end: 15 },
  { value: "3pm-11pm", start: 15, end: 23 },
  { value: "11pm-7am", start: 23, end: 7 },
];

// Trailing sections of the shift log, each seeded with one empty bullet
// for the concierge to fill in over the course of the shift. Exported
// because the inserter needs the full list to know where one section ends
// and the next begins when filing a note.
//
// The `section` values in HIGHLIGHTS below must match entries here — a name
// that drifts simply stops filing rather than filing somewhere wrong.
export const SHIFT_SECTIONS = [
  "KEYS REMAINING OUT",
  "MOVE IN/MOVE OUT KEYS",
  "PROPERTY MANAGEMENT NOTES",
  "CONCIERGE TEAM NOTES",
  "FACILITY/MAINTENANCE NOTES",
  "INCIDENTS OF NOTE",
];

// One-click "quick log" chips rendered under the popup preview. A plain
// chip inserts the time prefix + `text`. A chip carrying `form` instead
// opens a sub-form in the popup and builds its sentence from what the
// user fills in.
export const QUICK_LOGS = [
  {
    // Empty text leaves just the time prefix the builder adds to every
    // quick log — a bare stamp to start a line under.
    label: "Time",
    text: "",
  },
  {
    // Inline: appends to the entry the caret is already sitting on, which
    // is how a key coming back gets recorded against the entry that lent it.
    label: "Key returned",
    inline: true,
    text: "Key returned",
  },
  {
    label: "Begin shift",
    text: "Shift started.",
    form: {
      kind: "beginShift",
      title: "Begin shift",
      site: SITE_NAME,
      shifts: SHIFTS,
      sections: SHIFT_SECTIONS,
    },
  },
  {
    // A form rather than a plain chip: it both reports what is out and is
    // the one place something can be marked back in, whichever way it was
    // logged out.
    label: "Still out",
    form: { kind: "itemsOut", title: "Still out" },
  },
  {
    label: "End shift",
    form: { kind: "endShift", title: "End shift" },
  },
  {
    label: "Site tour",
    group: "tasks",
    task: "siteTour",
    text: "Site tour completed — all amenity floors checked, all doors checked, nothing to report.",
    form: { kind: "siteTour", title: "Site tour", areas: SITE_TOUR_AREAS },
  },
  {
    label: "Night lockup",
    text: "No activity in the lobby. Music volume reduced and lighting dimmed. Resident vestibule and inner vestibule checked, locked and secured. Remaining at the front desk.",
  },
  {
    // One job, and it belongs at the top of the shift — the handover is
    // only useful if it's read before the shift gets busy.
    label: "Read previous shift logs",
    group: "tasks",
    task: "readPrevious",
    required: 1,
    windowMinutes: 60,
    text: "Reviewed the previous shift's pass-on notes.",
  },
  {
    label: "Desk organized",
    group: "tasks",
    task: "deskOrganized",
    text: "Front desk organized, and the dog treats and mints by the desk refilled.",
  },
  {
    label: "Lobby checked",
    text: "Lobby area inspected; all clear.",
  },
];

// Flags shown above the preview in every popup mode. Ticking one tints the
// inserted sentence so a reader scanning the log can spot it at a glance.
// Backgrounds are deliberately pale — the log's own black text has to stay
// readable on top of them in whatever client the log lives in.
//
// Order matters: only one background can render on a sentence, so when
// several are ticked the first one listed here supplies the colour.
// One shared tint: the flags differ in where they file, not in colour.
const HIGHLIGHT_YELLOW = "#ffff00";

// `section` also files a copy of the sentence as a bullet under that
// heading further down the log, so a flagged note lands both where the
// concierge is typing and where the shift summary expects to find it.
export const HIGHLIGHTS = [
  {
    key: "concierge",
    label: "Notify concierge",
    color: HIGHLIGHT_YELLOW,
    section: "CONCIERGE TEAM NOTES",
  },
  {
    key: "propertyManager",
    label: "Notify property manager",
    color: HIGHLIGHT_YELLOW,
    section: "PROPERTY MANAGEMENT NOTES",
  },
  {
    key: "maintenance",
    label: "Notify maintenance",
    color: HIGHLIGHT_YELLOW,
    section: "FACILITY/MAINTENANCE NOTES",
  },
  {
    key: "incident",
    label: "Incident",
    color: HIGHLIGHT_YELLOW,
    section: "INCIDENTS OF NOTE",
  },
];
