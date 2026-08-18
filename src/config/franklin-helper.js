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
  ],
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
          label: "Drop off for pickup",
          template:
            "Resident[ {name}] from unit ({unit}) {contact} to drop {item} for {recipient} to pick-up later. (stored {storage})",
          fields: [
            DROP_ITEM_FIELD,
            { key: "recipient", label: "Drop for (name)", kind: "text" },
            STORAGE_FIELD,
          ],
        },
        {
          id: "pickupKeys",
          label: "Pick up keys",
          template:
            "Resident[ {name}] from unit ({unit}) {contact} to pick up keys that were left for them after identification was confirmed.",
        },
        {
          id: "report",
          label: "Report something",
          template:
            "Resident[ {name}] from unit ({unit}) {contact} to report that {description}.[ The report concerns unit ({aboutUnit}).]",
          fields: [
            { key: "description", label: "Report details", kind: "text" },
            {
              key: "aboutUnit",
              label: "About unit #",
              kind: "text",
              optional: true,
              placeholder: "(optional)",
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
          template:
            "Resident[ {name}] from unit ({unit}) {contact} to grab a dolly; the concierge assisted after confirmation.",
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
            "Guest[ {name}] of unit ({unit}[ {residentName}]) {contact} to pick up keys that were left for them after identification was confirmed.",
        },
        {
          id: "dropKeys",
          label: "Drop off for pickup",
          template:
            "Guest[ {name}] of unit ({unit}[ {residentName}]) {contact} to drop {item} for {recipient}. (stored {storage})",
          fields: [
            DROP_ITEM_FIELD,
            { key: "recipient", label: "Drop for (name)", kind: "text" },
            STORAGE_FIELD,
          ],
        },
        {
          id: "givenKeys",
          label: "Given unit keys",
          template:
            "Guest[ {name}] {contact} for unit ({unit}[ {residentName}]) and requested unit keys; {outcome}.",
          fields: [SERVICE_KEYS_OUTCOME],
        },
        {
          id: "returnedKeys",
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
      code: "ad",
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
      code: "dw",
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
          label: "Picked up unit keys",
          template:
            "Dog walker[ {name}][ from {company}] arrived for unit ({unit}) and requested unit keys; {outcome}.",
          fields: [SERVICE_KEYS_OUTCOME],
        },
        {
          id: "returnedKeys",
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
      ],
    },
    {
      id: "cleaner",
      code: "cl",
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
          label: "Picked up unit keys",
          template:
            "Cleaner[ {name}][ from {company}] arrived for unit ({unit}) and requested unit keys; {outcome}.",
          fields: [SERVICE_KEYS_OUTCOME],
        },
        {
          id: "returnedKeys",
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
      ],
    },
    {
      id: "vendor",
      code: "ve",
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
      ],
    },
    {
      id: "item",
      code: "it",
      label: "Item / property",
      // Anything the desk takes custody of that isn't a unit key: parking
      // passes, forgotten belongings, found property.
      fields: [NAME_FIELD, OPTIONAL_UNIT_FIELD],
      reasons: [
        {
          id: "droppedForPickup",
          label: "Dropped off for someone",
          template:
            "Resident[ {name}] of unit ({unit}) dropped off {item} at the front desk for {recipient} to collect. Stored {storage}.",
          fields: [
            { key: "item", label: "Item", kind: "text" },
            { key: "recipient", label: "For (name)", kind: "text" },
            STORAGE_FIELD,
          ],
        },
        {
          id: "collected",
          label: "Collected from the desk",
          template:
            "{name} collected {item} from the front desk[ for unit ({unit})]; identification confirmed.",
          fields: [{ key: "item", label: "Item", kind: "text" }],
        },
        {
          id: "leftForStorage",
          label: "Left for storage",
          template:
            "Resident[ {name}] of unit ({unit}) left {item} at the front desk to collect later. Stored {storage}.",
          fields: [
            { key: "item", label: "Item", kind: "text" },
            STORAGE_FIELD,
          ],
        },
        {
          id: "found",
          label: "Found property",
          template:
            "{item} was found at {location} and turned in to the front desk. {disposition}",
          fields: [
            { key: "item", label: "Item", kind: "text" },
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
                {
                  value: "Returned to the owner.",
                  label: "Returned to owner",
                },
              ],
            },
          ],
        },
      ],
    },
    {
      id: "moveKeys",
      code: "mo",
      label: "Move in/out keys",
      // Tracked apart from unit keys because the shift log reports them in
      // their own section.
      fields: [NAME_FIELD, UNIT_FIELD],
      reasons: [
        {
          id: "returned",
          label: "Keys returned",
          template:
            "{moveType} keys for unit ({unit}) were returned to the front desk[ by {name}] and {disposition}.",
          fields: [
            {
              key: "moveType",
              label: "Type",
              kind: "radio",
              options: ["Move-out", "Move-in"],
            },
            {
              key: "disposition",
              label: "Disposition",
              kind: "select",
              options: [
                {
                  value: "delivered to the leasing office",
                  label: "To leasing office",
                },
                {
                  value: "secured at the front desk",
                  label: "Held at desk",
                },
                { value: "left in the key lock box", label: "Key lock box" },
              ],
            },
          ],
        },
        {
          id: "released",
          label: "Keys released",
          template:
            "{moveType} keys for unit ({unit}) were released[ to {name}]; identification confirmed.",
          fields: [
            {
              key: "moveType",
              label: "Type",
              kind: "radio",
              options: ["Move-out", "Move-in"],
            },
          ],
        },
      ],
    },
    {
      id: "maintenance",
      code: "mt",
      label: "Maintenance",
      fields: [NAME_FIELD],
      reasons: [
        {
          id: "residentReported",
          label: "Resident reported an issue",
          template:
            "Resident of unit ({unit}) reported {issue}; {action}.",
          fields: [
            UNIT_FIELD,
            { key: "issue", label: "Issue", kind: "text" },
            {
              key: "action",
              label: "Action taken",
              kind: "radio",
              options: [
                {
                  value:
                    "Emergency Maintenance contact information was provided, the resident was advised same-evening response could not be guaranteed, and the maintenance team will be notified for follow-up",
                  label: "Emergency Maintenance referral",
                },
                {
                  value:
                    "a maintenance request was submitted on the resident's behalf",
                  label: "Request submitted",
                },
                {
                  value: "the maintenance team was notified directly",
                  label: "Team notified",
                },
              ],
            },
          ],
        },
        {
          id: "onSite",
          label: "Maintenance on site",
          template:
            "Maintenance[ {name}] arrived on site regarding {issue}[ for unit ({unit})].",
          fields: [
            { key: "issue", label: "Regarding", kind: "text" },
            OPTIONAL_UNIT_FIELD,
          ],
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
          id: "onSite",
          label: "On site",
          template: "{courier} arrived on site.",
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
          id: "residentInquiry",
          label: "Resident parking inquiry",
          // Voiced from the resident rather than the vendor: the role groups
          // parking matters, and this is the parking question residents ask.
          template:
            "Resident of unit ({unit}) inquired about {topic} for a {vehicle} ({plateState} plate {plate}); {action}.",
          fields: [
            UNIT_FIELD,
            {
              key: "topic",
              label: "Topic",
              kind: "select",
              options: [
                "overnight parking",
                "guest parking",
                "a parking pass",
                "a parking violation",
              ],
            },
            { key: "vehicle", label: "Vehicle", kind: "text", placeholder: "Honda Accord" },
            { key: "plateState", label: "Plate state", kind: "text", placeholder: "NJ" },
            { key: "plate", label: "Plate #", kind: "text", placeholder: "W14WWJ" },
            {
              key: "action",
              label: "Action",
              kind: "select",
              options: [
                {
                  value:
                    "the resident was advised the concierge would follow up once parking guidance is confirmed",
                  label: "Will follow up",
                },
                {
                  value: "Pilgrim Parking was contacted for guidance",
                  label: "Contacted Pilgrim",
                },
                { value: "a parking pass was issued", label: "Pass issued" },
              ],
            },
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
    label: "Night lockup",
    text: "No activity in the lobby. Music volume reduced and lighting dimmed. Resident vestibule and inner vestibule checked, locked and secured. Remaining at the front desk.",
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
