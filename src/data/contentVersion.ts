/* Version of the learning content: the tale texts at every level, their quiz
   questions and the council questions. Every learning event carries it
   (context.content_version, src/utils/events.ts), so an analysis can tell
   which text a learner actually read or answered.

   Rule: when a tale text, a quiz question or a council question changes,
   set CONTENT_VERSION to the date of the change and CONTENT_HASH to the
   value contentVersion.test.ts prints. The test fails until both are done. */
export const CONTENT_VERSION = "2026-11-04";
export const CONTENT_HASH = "e317c8c2";
