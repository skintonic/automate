import { GmailEmailMessage } from '../types';

/**
 * Encodes a string to RFC 4648 Base64URL without padding
 */
function base64UrlEncode(str: string): string {
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < utf8Bytes.length; i++) {
    binary += String.fromCharCode(utf8Bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Decodes base64url message body from Gmail API response
 */
function decodeBase64Url(data: string): string {
  try {
    const base64 = data.replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder('utf-8').decode(bytes);
  } catch (e) {
    console.error('Error decoding base64url:', e);
    return '';
  }
}

/**
 * Searches Gmail for messages matching query
 */
export async function searchGmailMessages(
  accessToken: string,
  query: string = 'from:helpareporter.com OR "HARO" OR "Connectively"'
): Promise<GmailEmailMessage[]> {
  const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=10`;
  
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Gmail search failed with status ${res.status}`);
  }

  const data = await res.json();
  if (!data.messages || data.messages.length === 0) {
    return [];
  }

  // Fetch full details for the matching messages
  const messagePromises = data.messages.map((m: { id: string }) =>
    fetchEmailDetails(accessToken, m.id)
  );

  const results = await Promise.allSettled(messagePromises);
  const emails: GmailEmailMessage[] = [];

  for (const result of results) {
    if (result.status === 'fulfilled' && result.value) {
      emails.push(result.value);
    }
  }

  return emails;
}

/**
 * Fetches full message details and parses subject, sender, date, and body
 */
export async function fetchEmailDetails(
  accessToken: string,
  messageId: string
): Promise<GmailEmailMessage> {
  const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages/${messageId}?format=full`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch message ${messageId}: ${res.statusText}`);
  }

  const data = await res.json();
  const headers = data.payload?.headers || [];

  const subjectHeader = headers.find((h: any) => h.name.toLowerCase() === 'subject');
  const fromHeader = headers.find((h: any) => h.name.toLowerCase() === 'from');
  const dateHeader = headers.find((h: any) => h.name.toLowerCase() === 'date');

  const subject = subjectHeader?.value || 'No Subject';
  const from = fromHeader?.value || 'Unknown Sender';
  const date = dateHeader?.value || new Date().toLocaleString();
  const snippet = data.snippet || '';

  // Extract body text
  let bodyText = '';
  let bodyHtml = '';

  const extractBody = (part: any) => {
    if (part.mimeType === 'text/plain' && part.body?.data) {
      bodyText += decodeBase64Url(part.body.data) + '\n';
    } else if (part.mimeType === 'text/html' && part.body?.data) {
      bodyHtml += decodeBase64Url(part.body.data);
    }

    if (part.parts && Array.isArray(part.parts)) {
      part.parts.forEach(extractBody);
    }
  };

  if (data.payload) {
    if (data.payload.body?.data) {
      const decoded = decodeBase64Url(data.payload.body.data);
      if (data.payload.mimeType === 'text/html') {
        bodyHtml = decoded;
      } else {
        bodyText = decoded;
      }
    }
    if (data.payload.parts) {
      data.payload.parts.forEach(extractBody);
    }
  }

  // Fallback: If bodyText is empty but HTML exists, strip tags for plaintext representation
  if (!bodyText.trim() && bodyHtml) {
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = bodyHtml;
    bodyText = tempDiv.innerText || tempDiv.textContent || '';
  }

  if (!bodyText.trim()) {
    bodyText = snippet;
  }

  return {
    id: data.id,
    threadId: data.threadId,
    subject,
    from,
    date,
    snippet,
    bodyText,
    bodyHtml,
  };
}

/**
 * Helper to construct an RFC 2822 email format message with UTF-8 and optional CC header
 */
function buildRfc2822Email(options: {
  to: string;
  cc?: string;
  subject: string;
  body: string;
}): string {
  const headers: string[] = [`To: ${options.to}`];

  if (options.cc && options.cc.trim()) {
    headers.push(`Cc: ${options.cc.trim()}`);
  }

  // Base64 encode the subject for UTF-8 safety
  headers.push(`Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(options.subject)))}?=`);
  headers.push('MIME-Version: 1.0');
  headers.push('Content-Type: text/plain; charset=UTF-8');
  headers.push('Content-Transfer-Encoding: 8bit');
  headers.push('');
  headers.push(options.body);

  return headers.join('\r\n');
}

/**
 * Creates a Gmail Draft
 * Standard RFC 2822 format with optional CC header
 */
export async function createGmailDraft(
  accessToken: string,
  options: {
    to: string;
    cc?: string;
    subject: string;
    body: string;
  }
): Promise<{ id: string; message: { id: string; threadId: string } }> {
  const rawEmail = buildRfc2822Email(options);
  const base64EncodedMessage = base64UrlEncode(rawEmail);

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: {
        raw: base64EncodedMessage,
      },
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(
      errData.error?.message || `Failed to create Gmail draft: HTTP ${res.status}`
    );
  }

  return await res.json();
}

/**
 * Sends an email directly via the Gmail API upon boss/executive approval.
 * If a draftId is provided, attempts to send that existing draft;
 * otherwise dispatches the raw RFC 2822 email directly via users/me/messages/send.
 */
export async function sendGmailMessage(
  accessToken: string,
  options: {
    to: string;
    cc?: string;
    subject: string;
    body: string;
    draftId?: string;
  }
): Promise<{ id: string; threadId: string; labelIds?: string[] }> {
  // If draftId exists, try sending that saved draft first
  if (options.draftId) {
    try {
      const draftRes = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts/send', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: options.draftId,
        }),
      });

      if (draftRes.ok) {
        return await draftRes.json();
      }
      console.warn('Sending existing draft failed, falling back to direct message send.');
    } catch (e) {
      console.warn('Draft send error:', e);
    }
  }

  // Fallback or Direct Send via messages/send
  const rawEmail = buildRfc2822Email(options);
  const base64EncodedMessage = base64UrlEncode(rawEmail);

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: base64EncodedMessage,
    }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(
      errData.error?.message || `Failed to send email via Gmail: HTTP ${res.status}`
    );
  }

  return await res.json();
}

/**
 * Fetches Gmail thread metadata to monitor journalist replies and interaction
 */
export async function fetchGmailThread(accessToken: string, threadId: string): Promise<any> {
  const url = `https://gmail.googleapis.com/gmail/v1/users/me/threads/${threadId}?format=metadata`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.error?.message || `Failed to fetch thread ${threadId}: HTTP ${res.status}`);
  }

  return await res.json();
}

/**
 * Checks a sent pitch's Gmail thread for replies, open status, and response time
 */
export async function checkThreadEngagement(
  accessToken: string,
  threadId: string
): Promise<{
  threadId: string;
  hasReply: boolean;
  replyCount: number;
  repliedAt?: string;
  replySender?: string;
  replySnippet?: string;
  isOpened: boolean;
  openedAt?: string;
  responseTimeHours?: number;
}> {
  const threadData = await fetchGmailThread(accessToken, threadId);
  const messages = threadData.messages || [];

  if (messages.length === 0) {
    return {
      threadId,
      hasReply: false,
      replyCount: 0,
      isOpened: false,
    };
  }

  const initialMsg = messages[0];
  const initialHeaders = initialMsg.payload?.headers || [];
  const initialDateStr = initialHeaders.find((h: any) => h.name.toLowerCase() === 'date')?.value;
  const initialTimestamp = initialDateStr ? Date.parse(initialDateStr) : undefined;

  let hasReply = false;
  let replyCount = 0;
  let repliedAt: string | undefined;
  let replySender: string | undefined;
  let replySnippet: string | undefined;
  let responseTimeHours: number | undefined;

  if (messages.length > 1) {
    for (let i = 1; i < messages.length; i++) {
      const msg = messages[i];
      const headers = msg.payload?.headers || [];
      const fromHeader = headers.find((h: any) => h.name.toLowerCase() === 'from')?.value || '';
      const dateHeader = headers.find((h: any) => h.name.toLowerCase() === 'date')?.value || '';

      hasReply = true;
      replyCount++;
      replySender = fromHeader;
      repliedAt = dateHeader;
      replySnippet = msg.snippet;

      if (initialTimestamp && dateHeader) {
        const replyTs = Date.parse(dateHeader);
        if (!isNaN(replyTs) && !isNaN(initialTimestamp) && replyTs > initialTimestamp) {
          responseTimeHours = Math.max(0.1, Number(((replyTs - initialTimestamp) / (1000 * 60 * 60)).toFixed(1)));
        }
      }
    }
  }

  const isUnread = messages.some((m: any) => m.labelIds && m.labelIds.includes('UNREAD'));
  const isOpened = !isUnread || hasReply;

  return {
    threadId,
    hasReply,
    replyCount,
    repliedAt,
    replySender,
    replySnippet,
    isOpened,
    openedAt: isOpened ? (initialDateStr || new Date().toLocaleString()) : undefined,
    responseTimeHours,
  };
}
