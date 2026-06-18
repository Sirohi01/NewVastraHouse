"use client";

import { useEffect, useState } from "react";
import { ResponsiveImage } from "@/components/media/ResponsiveImage";
import { apiBaseUrl } from "@/lib/api";
import {
  fetchAdminPaymentSettings,
  saveAdminPaymentSettings,
  type PaymentSettings,
} from "@/lib/payments";
import { useAuthStore } from "@/stores/authStore";

const emptySettings: PaymentSettings = {
  bankAccountName: "",
  bankAccountNumber: "",
  bankIfsc: "",
  bankName: "",
  manualInstructions: "",
  upiId: "",
  upiQrImageUrl: "",
};

export function AdminPaymentSettingsClient() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const [settings, setSettings] = useState<PaymentSettings>(emptySettings);
  const [message, setMessage] = useState("");
  const [uploadingQr, setUploadingQr] = useState(false);

  useEffect(() => {
    async function loadSettings() {
      try {
        const payload = await fetchAdminPaymentSettings(accessToken);
        setSettings({ ...emptySettings, ...payload.settings });
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Payment settings failed");
      }
    }

    void loadSettings();
  }, [accessToken]);

  async function save(formData: FormData) {
    setMessage("Saving payment settings...");
    try {
      const payload = await saveAdminPaymentSettings(
        {
          bankAccountName: text(formData, "bankAccountName"),
          bankAccountNumber: text(formData, "bankAccountNumber"),
          bankIfsc: text(formData, "bankIfsc"),
          bankName: text(formData, "bankName"),
          manualInstructions: text(formData, "manualInstructions"),
          upiId: text(formData, "upiId"),
          upiQrImageUrl: text(formData, "upiQrImageUrl"),
        },
        accessToken,
      );
      setSettings({ ...emptySettings, ...payload.settings });
      setMessage("Payment settings saved");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Save failed");
    }
  }

  async function uploadQr(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setUploadingQr(true);
    setMessage("Uploading UPI QR...");

    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("aspectRatio", "1:1");
      formData.set("context", "payment-screenshot");
      formData.set("objectFit", "contain");
      formData.set("altText", "UPI payment QR code");
      formData.set("tags", "upi,qr,payment");

      const response = await fetch(`${apiBaseUrl}/media/upload`, {
        body: formData,
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
        method: "POST",
      });

      if (!response.ok) {
        throw new Error((await response.text()) || "QR upload failed");
      }

      const payload = (await response.json()) as {
        media: { secureUrl: string };
      };
      setSettings((current) => ({ ...current, upiQrImageUrl: payload.media.secureUrl }));
      setMessage("QR uploaded. Save payment details to publish it.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "QR upload failed");
    } finally {
      setUploadingQr(false);
      event.target.value = "";
    }
  }

  return (
    <form action={save} className="rounded-lg border border-border bg-card p-4 shadow-soft">
      <div className="mb-3">
        <h2 className="text-lg font-semibold">Payment Details</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          These values appear in checkout for UPI and manual bank transfer.
        </p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <Field defaultValue={settings.upiId} label="UPI ID" name="upiId" required />
        <div className="text-sm font-medium">
          UPI QR image
          <div className="mt-2 grid gap-2 rounded-md border border-border p-3">
            {settings.upiQrImageUrl ? (
              <div className="w-28">
                <ResponsiveImage
                  alt="UPI payment QR code"
                  aspectRatio="1:1"
                  objectFit="contain"
                  src={settings.upiQrImageUrl}
                />
              </div>
            ) : null}
            <input
              name="upiQrImageUrl"
              onChange={(event) =>
                setSettings((current) => ({ ...current, upiQrImageUrl: event.target.value }))
              }
              type="hidden"
              value={settings.upiQrImageUrl ?? ""}
            />
            <input
              accept="image/png,image/jpeg,image/webp"
              className="block w-full rounded-md border border-border p-2 text-sm"
              disabled={uploadingQr}
              onChange={uploadQr}
              type="file"
            />
            <span className="text-xs text-muted-foreground">
              {uploadingQr ? "Uploading..." : "Upload a square QR image."}
            </span>
          </div>
        </div>
        <Field defaultValue={settings.bankName} label="Bank name" name="bankName" />
        <Field
          defaultValue={settings.bankAccountName}
          label="Account name"
          name="bankAccountName"
        />
        <Field
          defaultValue={settings.bankAccountNumber}
          label="Account number"
          name="bankAccountNumber"
        />
        <Field defaultValue={settings.bankIfsc} label="IFSC" name="bankIfsc" />
        <label className="text-sm font-medium md:col-span-2">
          Manual payment instructions
          <textarea
            className="mt-2 min-h-20 w-full rounded-md border border-border p-3"
            defaultValue={settings.manualInstructions}
            name="manualInstructions"
          />
        </label>
      </div>
      <button className="mt-4 h-10 rounded-md bg-primary px-4 text-sm font-semibold text-primary-foreground">
        Save Payment Details
      </button>
      {message ? <p className="mt-3 text-sm font-semibold text-accent">{message}</p> : null}
    </form>
  );
}

function Field({
  label,
  ...props
}: Readonly<React.InputHTMLAttributes<HTMLInputElement> & { label: string }>) {
  return (
    <label className="text-sm font-medium">
      {label}
      <input className="mt-2 h-10 w-full rounded-md border border-border px-3" {...props} />
    </label>
  );
}

function text(formData: FormData, key: string) {
  const value = formData.get(key);
  return typeof value === "string" ? value.trim() : "";
}
