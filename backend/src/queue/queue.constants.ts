// Centralizing queue/job names avoids typos like 'petiton-review' silently
// creating a second, empty queue that nothing ever processes.
export const PETITION_REVIEW_QUEUE = 'petition-review';
export const PETITION_EXPIRY_QUEUE = 'petition-expiry-sweep';

export const PETITION_REVIEW_JOB = 'review';
export const PETITION_EXPIRY_JOB = 'sweep';

// Fixed id for the repeatable expiry-sweep job so re-registering it on every
// app restart updates the existing schedule instead of stacking duplicates.
export const PETITION_EXPIRY_REPEAT_JOB_ID = 'petition-expiry-sweep-repeat';
