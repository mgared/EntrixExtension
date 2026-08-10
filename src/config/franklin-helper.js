// Roles, role-level fields, and reason templates.
//
// Each role has a 2-letter `code` for the shorthand trigger (e.g. `;re1` →
// the first reason on the role with code "re") and an optional `fields`
// array of role-level form fields the popup renders before the reason
// dropdown. Each reason owns its full sentence `template` (placeholders
// like `{key}`) plus an optional `fields` array of reason-level fields.
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
//
// Cap: 9 reasons per role (single-digit shorthand).

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

const UNIT_FIELD = {
  key: "unit",
  label: "Unit #",
  kind: "text",
  placeholder: "1204",
};

// Shared service-role outcome radios (Dog Walker / Cleaner / Baby Sitter).
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
    },
    {
      value:
        "confirmed on the resident visitor list, keys exchanged for an ID",
      label: "Granted — visitor list",
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
    },
    {
      value:
        "confirmed with the leasing/maintenance team, keys exchanged for an ID",
      label: "Granted — leasing/maintenance",
    },
    {
      value:
        "denied, failed to confirm with the resident or the leasing/maintenance team",
      label: "Denied — couldn't confirm",
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

export const HELPER = {
  defaultRoleId: "resident",
  roles: [
    {
      id: "resident",
      code: "re",
      label: "Resident",
      fields: [NAME_FIELD, UNIT_FIELD, CONTACT_FIELD],
      reasons: [
        {
          id: "dropKeys",
          label: "Drop keys for pickup",
          template:
            "Resident[ {name}] from unit ({unit}) {contact} to drop keys for {recipient} to pick-up later. (stored {storage})",
          fields: [
            { key: "recipient", label: "Drop for (name)", kind: "text" },
            {
              key: "storage",
              label: "Stored",
              kind: "select",
              options: [
                { value: "by desk cabinet", label: "Desk cabinet" },
                { value: "by key lock box", label: "Key lock box" },
                { value: "inside package room", label: "Package room" },
                { value: "in keytrack", label: "Keytrack" },
              ],
            },
          ],
        },
        {
          id: "pickupKeys",
          label: "Pick up keys",
          template:
            "Resident[ {name}] from unit ({unit}) {contact} to pick up keys that were left for them.",
        },
        {
          id: "report",
          label: "Report something",
          template:
            "Resident[ {name}] from unit ({unit}) {contact} to report that {description}.",
          fields: [
            { key: "description", label: "Report details", kind: "text" },
          ],
        },
        {
          id: "missingPackage",
          label: "Missing package",
          template:
            "Resident[ {name}] from unit ({unit}) {contact} to inquire about a missing package that was delivered on {deliveredDate}.",
          fields: [
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
          template:
            "Resident[ {name}] from unit ({unit}) {contact} to grab a dolly.",
        },
        {
          id: "elevatorAccess",
          label: "Request elevator access",
          template:
            "Resident[ {name}] from unit ({unit}) {contact} to request elevator access.",
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
      ],
    },
    {
      id: "guest",
      code: "gu",
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
          label: "Pick up keys",
          template:
            "Guest[ {name}] of unit ({unit}[ {residentName}]) {contact} to pick up keys that were left for them.",
        },
        {
          id: "dropKeys",
          label: "Drop keys",
          template:
            "Guest[ {name}] of unit ({unit}[ {residentName}]) {contact} to drop keys for {recipient}.",
          fields: [
            { key: "recipient", label: "Drop for (name)", kind: "text" },
          ],
        },
        {
          id: "givenKeys",
          label: "Given unit keys",
          template:
            "Guest[ {name}] arrived for unit ({unit}[ {residentName}]) and requested unit keys; {outcome}.",
          fields: [SERVICE_KEYS_OUTCOME],
        },
      ],
    },
    {
      id: "appDelivery",
      code: "ad",
      label: "App delivery",
      fields: [NAME_FIELD, UNIT_FIELD],
      reasons: [
        {
          id: "delivered",
          label: "Delivered — awaiting pickup",
          template:
            "App delivery[ from {name}] for unit ({unit}) was delivered and is awaiting pick-up at the front desk.",
        },
        {
          id: "lobby30",
          label: "Not picked up >30 min — stored",
          template:
            "App delivery[ from {name}] for unit ({unit}) has not been picked-up for more than 30 minutes; resident notified and the delivery was stored in the fridge.",
        },
      ],
    },
    {
      id: "dogWalker",
      code: "dw",
      label: "Dog Walker",
      fields: [NAME_FIELD, UNIT_FIELD],
      reasons: [
        {
          id: "sentUp",
          label: "Sent up",
          template:
            "Dog walker[ {name}] arrived for unit ({unit}); {outcome}.",
          fields: [SERVICE_SENT_UP_OUTCOME],
        },
        {
          id: "pickedUpKeys",
          label: "Picked up unit keys",
          template:
            "Dog walker[ {name}] arrived for unit ({unit}) and requested unit keys; {outcome}.",
          fields: [SERVICE_KEYS_OUTCOME],
        },
        {
          id: "returnedKeys",
          label: "Returned unit keys",
          template:
            "Dog walker[ {name}] returned the unit keys for unit ({unit}) to the front desk and their ID was handed back.",
        },
      ],
    },
    {
      id: "cleaner",
      code: "cl",
      label: "Cleaner",
      fields: [NAME_FIELD, UNIT_FIELD],
      reasons: [
        {
          id: "sentUp",
          label: "Sent up",
          template: "Cleaner[ {name}] arrived for unit ({unit}); {outcome}.",
          fields: [SERVICE_SENT_UP_OUTCOME],
        },
        {
          id: "pickedUpKeys",
          label: "Picked up unit keys",
          template:
            "Cleaner[ {name}] arrived for unit ({unit}) and requested unit keys; {outcome}.",
          fields: [SERVICE_KEYS_OUTCOME],
        },
        {
          id: "returnedKeys",
          label: "Returned unit keys",
          template:
            "Cleaner[ {name}] returned the unit keys for unit ({unit}) to the front desk and their ID was handed back.",
        },
      ],
    },
    {
      id: "babySitter",
      code: "bs",
      label: "Baby Sitter",
      fields: [NAME_FIELD, UNIT_FIELD],
      reasons: [
        {
          id: "sentUp",
          label: "Sent up",
          template:
            "Baby sitter[ {name}] arrived for unit ({unit}); {outcome}.",
          fields: [SERVICE_SENT_UP_OUTCOME],
        },
        {
          id: "givenKeys",
          label: "Given unit keys",
          template:
            "Baby sitter[ {name}] arrived for unit ({unit}) and requested unit keys; {outcome}.",
          fields: [SERVICE_KEYS_OUTCOME],
        },
      ],
    },
    {
      id: "vendor",
      code: "ve",
      label: "Vendor",
      // A vendor may be working on a unit or on a common area, so the unit
      // is optional and drops out of the sentence when left empty.
      fields: [
        NAME_FIELD,
        { ...UNIT_FIELD, optional: true, placeholder: "(optional)" },
      ],
      reasons: [
        {
          id: "pickedUpKeys",
          label: "Picked up vendor keys",
          template:
            "Vendor[ {name}] requested vendor keys[ for unit ({unit})]; {outcome}.",
          fields: [VENDOR_KEYS_OUTCOME],
        },
        {
          id: "returnedKeys",
          label: "Returned vendor keys",
          template:
            "Vendor[ {name}] returned the vendor keys[ for unit ({unit})] to the front desk and their ID was handed back.",
        },
      ],
    },
    {
      id: "leasingOffice",
      code: "lo",
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
          template:
            "Leasing office staff[ {name}] dropped off {item} for unit ({unit}).",
          fields: [
            { key: "item", label: "Item", kind: "text" },
            { key: "unit", label: "Unit #", kind: "text" },
          ],
        },
        {
          id: "pickup",
          label: "Picked something up",
          template:
            "Leasing office staff[ {name}] picked up {item} from the front desk.",
          fields: [{ key: "item", label: "Item", kind: "text" }],
        },
      ],
    },
    {
      id: "prospect",
      code: "pr",
      label: "Prospect",
      fields: [NAME_FIELD],
      reasons: [
        {
          id: "walkInTour",
          label: "Walk-in tour",
          template:
            "Prospect[ {name}] walked in for a tour; the leasing team was informed.",
        },
        {
          id: "scheduledLeasing",
          label: "Scheduled tour with leasing",
          template:
            "Prospect[ {name}] arrived for their scheduled tour with the leasing team; leasing was informed.",
        },
      ],
    },
    {
      id: "package",
      code: "pk",
      label: "Package",
      fields: [COURIER_FIELD, COURIER_OTHER_FIELD],
      reasons: [
        {
          id: "droppedBulk",
          label: "Dropped a bulk of packages",
          template: "{courier} dropped off a bulk of packages at the front desk.",
        },
        {
          id: "pickedUpReturns",
          label: "Picked up returns",
          template: "{courier} picked up returns from the front desk.",
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
      code: "co",
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
          template: "Concierge[ {name}] returned from break.",
        },
        {
          id: "siteTouring",
          label: "On site touring",
          template: "Concierge[ {name}] left the front desk for a site tour.",
        },
      ],
    },
    {
      id: "pilgrimParking",
      code: "pp",
      label: "Pilgrim Parking",
      fields: [NAME_FIELD],
      reasons: [
        {
          id: "report",
          label: "Report something",
          template:
            "Pilgrim Parking staff[ {name}] came to the front desk to report that {description}.",
          fields: [
            { key: "description", label: "Report details", kind: "text" },
          ],
        },
        {
          id: "dropOff",
          label: "Drop something off",
          template:
            "Pilgrim Parking staff[ {name}] dropped off {item} at the front desk[ for unit ({unit})].",
          fields: [
            { key: "item", label: "Item", kind: "text" },
            {
              key: "unit",
              label: "Unit #",
              kind: "text",
              optional: true,
              placeholder: "(optional)",
            },
          ],
        },
      ],
    },
  ],
};

// The coffee machines get a status picker on top of the "all clear" tick,
// since servicing them is part of the walk rather than just checking them.
const COFFEE_STATUSES = [
  "stocked",
  "rinsed",
  "stocked and rinsed",
  "down awaiting repair",
];

// Areas walked on a site tour, in walking order. Each renders a row with
// a tick box and an issue box, and every control is optional: an area left
// untouched is simply not mentioned in the log.
//
// `clear` is what ticking that area reports, on the box and in the
// sentence — most areas are just "all clear", but some have a specific
// thing the walker is confirming. `options` adds a status dropdown, and
// `people: true` adds an occupancy count box.
export const SITE_TOUR_AREAS = [
  {
    id: "lobby",
    label: "Lobby area",
    clear: "waiting area chairs organized, all clear",
  },
  { id: "mailRoom", label: "Mail room" },
  { id: "geniusBar", label: "Genius bar" },
  { id: "leasingOffice", label: "Leasing Office" },
  { id: "meetingRooms", label: "Meeting rooms", clear: "organized and neat" },
  { id: "coffee1", label: "Coffee machine #1", options: COFFEE_STATUSES },
  { id: "gym", label: "GYM" },
  { id: "dogWash", label: "Dog wash", clear: "clean" },
  { id: "emergencyExit", label: "Emergency exit door", clear: "secured" },
  { id: "terrace2", label: "2nd floor terrace" },
  { id: "trashChute", label: "Trash Chute by Moxies" },
  { id: "serviceElevator", label: "Service elevator and access" },
  {
    id: "electrical11",
    label: "11th floor electrical room",
    clear: "music turned on and operational",
  },
  { id: "patio12", label: "12th floor reservable patio and area" },
  {
    id: "tvGameRoom",
    label: "TV and game room",
    clear: "TV turned on, pool table and shuffle board set",
  },
  { id: "coffee2", label: "Coffee machine #2", options: COFFEE_STATUSES },
  {
    id: "fireplace12",
    label: "12th floor Fire place",
    clear: "turned off and all clear",
  },
  { id: "pool", label: "Pool area", people: true },
  { id: "grill", label: "Grill area", people: true },
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
    label: "Begin shift",
    text: "Shift started.",
    form: {
      kind: "beginShift",
      title: "Begin shift",
      site: "ORA",
      shifts: SHIFTS,
      sections: SHIFT_SECTIONS,
    },
  },
  {
    label: "Site tour",
    text: "Site tour completed — all amenity floors checked, all doors checked, nothing to report.",
    form: { kind: "siteTour", title: "Site tour", areas: SITE_TOUR_AREAS },
  },
  {
    label: "Desk organized",
    text: "Front desk organized.",
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
const HIGHLIGHT_YELLOW = "#ffef9e";

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
