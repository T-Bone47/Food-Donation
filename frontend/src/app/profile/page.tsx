"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useCurrentUser } from "@/lib/session";
import { authApi } from "@/lib/api-client";

export default function Profile() {
  const { user } = useCurrentUser();
  const [profile, setProfile] = useState({
    name: "John Doe",
    email: "john@example.com",
    phone: "+91 9876543210",
    address: "Bengaluru, India",
    role: "Donor",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(profile);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user) {
      const updated = {
        name: user.name || "FoodShare Partner",
        email: user.email || "partner@example.org",
        phone: user.phonenumber || "+91 98765 43210",
        address: user.organization || "Bengaluru, Karnataka (560001)",
        role: user.role || "Donor",
      };
      setProfile(updated);
      setFormData(updated);
    }
  }, [user]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await authApi.updateMe({
        name: formData.name,
        phonenumber: formData.phone,
      });
      setProfile(formData);
      setIsEditing(false);
      alert("Profile updated successfully!");
    } catch (err) {
      console.error(err);
      setProfile(formData);
      setIsEditing(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#EEF4EC] text-[#111827]">
      <Navbar />

      <div className="max-w-xl mx-auto px-6 py-8 space-y-6">
        {/* Deep Forest Pine Command Banner */}
        <div className="bg-[#0B331E] border border-[#184F31] rounded-lg p-6 text-white shadow-xs">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-mono tracking-wider px-2 py-0.5 rounded bg-[#13492B] text-emerald-300 border border-[#21663F]">
              CREDENTIAL LEDGER
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-500/40 text-emerald-300">
              IDENTITY: VERIFIED
            </span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">Account Profile</h1>
          <p className="text-xs text-emerald-100/75 mt-1">
            Manage your FoodShare credentials, contact details, and facility organization settings
          </p>
        </div>

        <div className="manifest-docket p-6">
          <div className="space-y-4">
            <div>
              <Label className="block text-xs font-semibold text-gray-800 mb-1">
                Full Name
              </Label>
              {isEditing ? (
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-sm bg-white border-[#CBDBC7] focus:border-[#135936]"
                />
              ) : (
                <p className="text-gray-900 p-2.5 bg-[#F2F7F0] rounded border border-[#CBDBC7] text-sm font-semibold">
                  {profile.name}
                </p>
              )}
            </div>

            <div>
              <Label className="block text-xs font-semibold text-gray-800 mb-1">
                Email Address
              </Label>
              <p className="text-gray-700 p-2.5 bg-[#F2F7F0] rounded border border-[#CBDBC7] text-sm font-mono">
                {profile.email}
              </p>
            </div>

            <div>
              <Label className="block text-xs font-semibold text-gray-800 mb-1">
                Role Classification
              </Label>
              <div>
                <span className="inline-block text-[#115E34] px-3 py-1 bg-[#E4F2E7] rounded border border-[#A9D8B6] text-xs font-bold font-mono">
                  {profile.role.toUpperCase()}
                </span>
              </div>
            </div>

            <div>
              <Label className="block text-xs font-semibold text-gray-800 mb-1">
                Phone Number
              </Label>
              {isEditing ? (
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full text-sm bg-white border-[#CBDBC7] focus:border-[#135936]"
                />
              ) : (
                <p className="text-gray-900 p-2.5 bg-[#F2F7F0] rounded border border-[#CBDBC7] text-sm font-mono font-medium">
                  {profile.phone}
                </p>
              )}
            </div>

            <div>
              <Label className="block text-xs font-semibold text-gray-800 mb-1">
                Organization / Facility Address
              </Label>
              {isEditing ? (
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full text-sm bg-white border-[#CBDBC7] focus:border-[#135936]"
                />
              ) : (
                <p className="text-gray-900 p-2.5 bg-[#F2F7F0] rounded border border-[#CBDBC7] text-sm font-medium">
                  {profile.address}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-[#CBDBC7]">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFormData(profile);
                      setIsEditing(false);
                    }}
                    className="cursor-pointer text-xs border-[#CBDBC7] text-gray-700 hover:bg-[#E2ECE0]"
                  >
                    Cancel
                  </Button>
                  <Button
                    className="bg-[#135936] hover:bg-[#0D4026] text-white cursor-pointer font-bold text-xs shadow-xs"
                    disabled={saving}
                    onClick={handleSave}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </>
              ) : (
                <Button
                  className="bg-[#135936] hover:bg-[#0D4026] text-white cursor-pointer font-bold text-xs shadow-xs"
                  onClick={handleEdit}
                >
                  Edit Profile
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
