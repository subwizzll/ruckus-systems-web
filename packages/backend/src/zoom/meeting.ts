const ZOOM_OAUTH_URL = "https://zoom.us/oauth/token";
const ZOOM_API_BASE = "https://api.zoom.us/v2";

const ZOOM_ACCOUNT_ID = process.env.ZOOM_ACCOUNT_ID;
const ZOOM_CLIENT_ID = process.env.ZOOM_CLIENT_ID;
const ZOOM_CLIENT_SECRET = process.env.ZOOM_CLIENT_SECRET;

export interface ZoomMeetingSettings {
  host_video?: boolean;
  participant_video?: boolean;
  join_before_host?: boolean;
  mute_upon_entry?: boolean;
  watermark?: boolean;
  audio?: "both" | "telephony" | "voip";
  auto_recording?: "local" | "cloud" | "none";
  waiting_room?: boolean;
}

export interface CreateZoomMeetingInput {
  topic: string;
  type?: "1" | "2" | "3" | "8";
  start_time: string;
  duration: number;
  timezone?: string;
  agenda?: string;
  settings?: ZoomMeetingSettings;
}

interface ZoomOAuthResponse {
  access_token: string;
  expires_in: number;
}

interface ZoomMeetingResponse {
  id: number;
  topic: string;
  start_time: string;
  duration: number;
  join_url: string;
  start_url: string;
  password?: string;
}

let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getZoomAccessToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && tokenExpiry > now + 5 * 60 * 1000) return cachedToken;

  if (!ZOOM_ACCOUNT_ID || !ZOOM_CLIENT_ID || !ZOOM_CLIENT_SECRET) {
    throw new Error("Missing Zoom credentials");
  }

  const credentials = Buffer.from(`${ZOOM_CLIENT_ID}:${ZOOM_CLIENT_SECRET}`).toString("base64");
  const response = await fetch(
    `${ZOOM_OAUTH_URL}?grant_type=account_credentials&account_id=${ZOOM_ACCOUNT_ID}`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${credentials}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
    },
  );
  if (!response.ok) {
    throw new Error(`Zoom OAuth failed: ${response.status}`);
  }

  const data = (await response.json()) as ZoomOAuthResponse;
  cachedToken = data.access_token;
  tokenExpiry = now + data.expires_in * 1000;
  return cachedToken;
}

export async function createZoomMeeting(meetingData: CreateZoomMeetingInput) {
  try {
    const accessToken = await getZoomAccessToken();
    const response = await fetch(`${ZOOM_API_BASE}/users/me/meetings`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        topic: meetingData.topic,
        type: parseInt(meetingData.type || "2", 10),
        start_time: meetingData.start_time,
        duration: meetingData.duration,
        timezone: meetingData.timezone || "America/New_York",
        agenda: meetingData.agenda || "",
        settings: meetingData.settings || {
          host_video: true,
          participant_video: true,
          join_before_host: false,
          mute_upon_entry: false,
          watermark: false,
          audio: "both",
          auto_recording: "none",
          waiting_room: true,
        },
      }),
    });
    if (!response.ok) throw new Error(`Zoom API error ${response.status}`);

    const meeting = (await response.json()) as ZoomMeetingResponse;
    return {
      success: true,
      data: {
        meetingId: meeting.id.toString(),
        joinUrl: meeting.join_url,
        startUrl: meeting.start_url,
        password: meeting.password,
        topic: meeting.topic,
        startTime: meeting.start_time,
        duration: meeting.duration,
      },
    };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed" };
  }
}

export async function updateZoomMeeting(
  meetingId: string,
  updates: { topic?: string; start_time?: string; duration?: number; timezone?: string; agenda?: string },
) {
  try {
    const accessToken = await getZoomAccessToken();
    const response = await fetch(`${ZOOM_API_BASE}/meetings/${meetingId}`, {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    });
    if (!response.ok && response.status !== 204) throw new Error(`Zoom API error ${response.status}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed" };
  }
}

export async function deleteZoomMeeting(meetingId: string) {
  try {
    const accessToken = await getZoomAccessToken();
    const response = await fetch(`${ZOOM_API_BASE}/meetings/${meetingId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok && response.status !== 204) throw new Error(`Zoom API error ${response.status}`);
    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : "Failed" };
  }
}
