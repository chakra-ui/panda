import { ref } from "vue";

/** Where a link is loading a spec from, for the loading overlay. */
export const linkLoading = ref<string | null>(null);

/** Resolves once a hash link has loaded (true) or failed (false). Null when there is none. */
export const linkPending: { current: Promise<boolean> | null } = { current: null };
