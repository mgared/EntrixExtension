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
      value: "confirmed on the visitor list, keys exchanged for an ID",
      label: "Granted — keys exchanged for ID",
    },
    {
      value: "denied, failed to confirm with resident",
      label: "Denied — couldn't reach",
    },
  ],
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
            "Resident[ {name}] from unit ({unit}) {contact} to drop keys for {recipient} to pick-up later. (stored at {storage})",
          fields: [
            { key: "recipient", label: "Drop for (name)", kind: "text" },
            {
              key: "storage",
              label: "Stored at",
              kind: "select",
              options: [
                { value: "top drawer", label: "Top drawer" },
                { value: "package room", label: "Package room" },
                { value: "bottom drawer", label: "Bottom drawer" },
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
          id: "loadingDock",
          label: "Reserve loading dock",
          template:
            "Resident[ {name}] from unit ({unit}) {contact} to reserve the loading dock for {date}.",
          fields: [{ key: "date", label: "Reserve date", kind: "date" }],
        },
        {
          id: "elevatorAccess",
          label: "Request elevator access",
          template:
            "Resident[ {name}] from unit ({unit}) {contact} to request elevator access.",
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
            "Guest[ {name}] of unit ({unit}[ {residentName}]) {contact} to visit resident, access {outcome}.",
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
      id: "foodDelivery",
      code: "fd",
      label: "Food Delivery",
      fields: [NAME_FIELD, UNIT_FIELD],
      reasons: [
        {
          id: "requestSentUp",
          label: "Requested to be sent up",
          template:
            "Food delivery[ from {name}] for unit ({unit}) arrived and requested to be sent up; {outcome}.",
          fields: [
            {
              key: "outcome",
              label: "Outcome",
              kind: "radio",
              options: [
                {
                  value: "resident confirmed and it was sent up",
                  label: "Granted — resident confirmed",
                },
                {
                  value:
                    "resident couldn't be reached for confirmation, food left at the lobby",
                  label: "Denied — no confirmation",
                },
              ],
            },
          ],
        },
        {
          id: "lobby15",
          label: "Stayed in lobby >15 min",
          template:
            "Food delivery[ from {name}] for unit ({unit}) has not been picked-up for more than 15 minutes; {outcome}.",
          fields: [
            {
              key: "outcome",
              label: "Outcome",
              kind: "radio",
              options: [
                {
                  value: "resident was reached and notified",
                  label: "Resident reached & notified",
                },
                {
                  value: "resident couldn't be reached to be notified",
                  label: "Couldn't reach resident",
                },
              ],
            },
          ],
        },
        {
          id: "lobby30",
          label: "Stayed in lobby >30 min — stored",
          template:
            "Food delivery[ from {name}] for unit ({unit}) has not been picked-up for more than 30 minutes; stored in the fridge.",
        },
      ],
    },
    {
      id: "groceryDelivery",
      code: "gd",
      label: "Grocery Delivery",
      fields: [NAME_FIELD, UNIT_FIELD],
      reasons: [
        {
          id: "requestSentUp",
          label: "Requested to be sent up",
          template:
            "Grocery delivery[ from {name}] for unit ({unit}) arrived and requested to be sent up; {outcome}.",
          fields: [
            {
              key: "outcome",
              label: "Outcome",
              kind: "radio",
              options: [
                {
                  value: "resident confirmed and it was sent up",
                  label: "Granted — resident confirmed",
                },
                {
                  value:
                    "resident couldn't be reached for confirmation, groceries left at the lobby",
                  label: "Denied — no confirmation",
                },
              ],
            },
          ],
        },
        {
          id: "lobby30",
          label: "Stayed in lobby >30 min — stored",
          template:
            "Grocery delivery[ from {name}] for unit ({unit}) has not been picked-up for more than 30 minutes; stored in the fridge.",
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
          id: "givenKeys",
          label: "Given unit keys",
          template:
            "Dog walker[ {name}] arrived for unit ({unit}) and requested unit keys; {outcome}.",
          fields: [SERVICE_KEYS_OUTCOME],
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
          id: "givenKeys",
          label: "Given unit keys",
          template:
            "Cleaner[ {name}] arrived for unit ({unit}) and requested unit keys; {outcome}.",
          fields: [SERVICE_KEYS_OUTCOME],
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
        {
          id: "selfTour",
          label: "Self-guided tour (Tour24)",
          template:
            "Prospect[ {name}] arrived for a self-guided tour signed up through Tour24; tour keys were exchanged for an ID.",
        },
      ],
    },
  ],
};

// One-click "quick log" chips rendered under the popup preview. Each chip
// inserts the time prefix + `text`. `label` is what shows on the chip.
export const QUICK_LOGS = [
  {
    label: "Site tour",
    text: "Site tour completed — all amenity floors checked, all doors checked, nothing to report.",
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
