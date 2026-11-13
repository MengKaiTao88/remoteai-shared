# Group receipt rejection

Group capabilities are signed with a key derived from the persistent `KONG_JWT_SECRET`.
Rotating that secret invalidates existing capabilities. Restarting with the same secret and
a different ephemeral socket ticket key preserves them.

An authenticated, group-read-capable client sending an invalid capability receives:

```json
{
  "type": "group-receipt-rejected",
  "code": "invalid-group-receipt",
  "receiptType": "group-read",
  "id": "original-message-id",
  "from": "original-request-target",
  "to": "authenticated-request-sender",
  "groupReceipt": "original-capability"
}
```

`receiptType` can also be `group-read-confirm`. The server echoes request identifiers only
to the requesting connection; they do not establish token authorship. Invalid capabilities
are never forwarded. Signature, audience, message ID and author checks remain mandatory.
Malformed envelopes, unauthorized authors and existing session/rate limits retain their
protocol enforcement.

Clients match the rejection to the exact account, message, direction and capability before
persisting `delivery.groupReceiptError = "invalid-group-receipt"`. This terminal capability
failure survives history reload, late writes and same-account synchronization. It never
changes actual read status, reader lists or confirmation status. Valid unconfirmed reads
continue retrying; unknown error codes do not terminate delivery work.

Deploy the server before clients for full behavior. Older clients ignore the additive frame
and may retry, but each invalid capability no longer disconnects their authenticated socket.
Updated clients continue using the existing request protocol with older servers and cannot
infer permanent failure from a disconnect or a missing confirmation.
