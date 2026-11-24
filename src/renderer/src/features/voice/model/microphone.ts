// Which microphone Otto uses on this PC. Saved only here (each PC has its
// own devices); empty means the Windows default. When the chosen one is
// gone (headset off), Otto falls back to the default.
const KEY = "otto.microphone";

export type Microphone = { id: string; label: string };

export function preferredMicrophone(): string {
  try {
    return localStorage.getItem(KEY) ?? "";
  } catch {
    return "";
  }
}

export function setPreferredMicrophone(id: string): void {
  try {
    if (id) localStorage.setItem(KEY, id);
    else localStorage.removeItem(KEY);
  } catch {
    // Not saved: the default microphone keeps being used.
  }
}

/** Audio inputs, without the "default"/"communications" aliases. */
export async function listMicrophones(): Promise<Microphone[]> {
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices
    .filter(
      (device) =>
        device.kind === "audioinput" &&
        device.deviceId !== "default" &&
        device.deviceId !== "communications",
    )
    .map((device, index) => ({
      id: device.deviceId,
      label: device.label || `Microfone ${index + 1}`,
    }));
}

/** Opens the chosen microphone, or the default when it is not available. */
export async function openMicrophone(
  constraints: MediaTrackConstraints,
): Promise<MediaStream> {
  const id = preferredMicrophone();
  if (id) {
    try {
      return await navigator.mediaDevices.getUserMedia({
        audio: { ...constraints, deviceId: { exact: id } },
      });
    } catch {
      // Unplugged or renamed: use the default below.
    }
  }
  return navigator.mediaDevices.getUserMedia({ audio: constraints });
}
