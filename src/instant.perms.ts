// Docs: https://www.instantdb.com/docs/permissions

import type { InstantRules } from "@instantdb/react-native";

const rules = {
  $files: {
    allow: {
      view: "true",
      create: "auth.id != null",
      delete: "auth.id != null",
    },
  },
  profiles: {
    allow: {
      view: "true",
      create: "auth.id != null",
      update: "auth.id != null",
      delete: "auth.id != null",
    },
  },
  channels: {
    allow: {
      view: "true",
      create: "auth.id != null",
    },
  },
  messages: {
    allow: {
      view: "true",
      create: "auth.id != null",
      delete: "auth.id != null",
    },
  },
} satisfies InstantRules;

export default rules;
