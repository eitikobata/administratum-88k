// Internal EventEmitter2 event name (workflow service -> gateway), not the
// same thing as the WebSocket message name sent to the browser (though
// we reuse the same string for both, for simplicity — see gateway).
export const PETITION_UPDATED_EVENT = 'petition.updated';
