// Docs: https://www.instantdb.com/docs/modeling-data

import { i } from "@instantdb/react-native";

const _schema = i.schema({
  entities: {
    $files: i.entity({
      path: i.string().unique().indexed(),
      url: i.string(),
    }),
    $users: i.entity({
      email: i.string().unique().indexed().optional(),
      imageURL: i.string().optional(),
      type: i.string().optional(),
    }),
    profiles: i.entity({
      displayName: i.string(),
    }),
    channels: i.entity({
      name: i.string().indexed(),
    }),
    messages: i.entity({
      content: i.string(),
      timestamp: i.number().indexed(),
    }),
  },
  links: {
    $usersLinkedPrimaryUser: {
      forward: {
        on: "$users",
        has: "one",
        label: "linkedPrimaryUser",
        onDelete: "cascade",
      },
      reverse: {
        on: "$users",
        has: "many",
        label: "linkedGuestUsers",
      },
    },
    userProfile: {
      forward: {
        on: "profiles",
        has: "one",
        label: "user",
        onDelete: "cascade",
      },
      reverse: {
        on: "$users",
        has: "one",
        label: "profile",
      },
    },
    authorMessages: {
      forward: {
        on: "messages",
        has: "one",
        label: "author",
        onDelete: "cascade",
      },
      reverse: {
        on: "profiles",
        has: "many",
        label: "messages",
      },
    },
    channelMessages: {
      forward: {
        on: "messages",
        has: "one",
        label: "channel",
        onDelete: "cascade",
      },
      reverse: {
        on: "channels",
        has: "many",
        label: "messages",
      },
    },
    profileAvatar: {
      forward: {
        on: "profiles",
        has: "one",
        label: "avatar",
        onDelete: "cascade",
      },
      reverse: {
        on: "$files",
        has: "many",
        label: "profiles",
      },
    },
  },
  rooms: {
    chat: {
      presence: i.entity({
        profileId: i.string(),
        displayName: i.string(),
      }),
    }
  }
});

// This helps Typescript display nicer intellisense
type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema { }
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;