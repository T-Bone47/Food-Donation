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
    <main className="min-h-screen bg-[#F9FAFB] text-[#111827]">
      <Navbar />

      <div className="max-w-xl mx-auto px-6 py-8 space-y-6">
        <div className="pb-2 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Account Profile</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage your FoodShare credentials, contact details, and organization settings
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="space-y-4">
            <div>
              <Label className="block text-xs font-medium text-gray-700 mb-1">
                Full Name
              </Label>
              {isEditing ? (
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full text-sm"
                />
              ) : (
                <p className="text-gray-900 p-2 bg-gray-50 rounded border border-gray-200 text-sm font-medium">
                  {profile.name}
                </p>
              )}
            </div>

            <div>
              <Label className="block text-xs font-medium text-gray-700 mb-1">
                Email Address
              </Label>
              <p className="text-gray-600 p-2 bg-gray-50 rounded border border-gray-200 text-sm">
                {profile.email}
              </p>
            </div>

            <div>
              <Label className="block text-xs font-medium text-gray-700 mb-1">
                Role Classification
              </Label>
              <p className="inline-block text-emerald-800 px-2.5 py-1 bg-emerald-50 rounded border border-emerald-200 text-xs font-semibold">
                {profile.role}
              </p>
            </div>

            <div>
              <Label className="block text-xs font-medium text-gray-700 mb-1">
                Phone Number
              </Label>
              {isEditing ? (
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full text-sm"
                />
              ) : (
                <p className="text-gray-900 p-2 bg-gray-50 rounded border border-gray-200 text-sm font-medium">
                  {profile.phone}
                </p>
              )}
            </div>

            <div>
              <Label className="block text-xs font-medium text-gray-700 mb-1">
                Organization / Facility Address
              </Label>
              {isEditing ? (
                <Input
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full text-sm"
                />
              ) : (
                <p className="text-gray-900 p-2 bg-gray-50 rounded border border-gray-200 text-sm font-medium">
                  {profile.address}
                </p>
              )}
            </div>

            <div className="flex justify-end gap-2.5 mt-6 pt-4 border-t border-gray-100">
              {isEditing ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFormData(profile);
                      setIsEditing(false);
                    }}
                    className="cursor-pointer text-xs"
                  >
                    Cancel
                  </Button>
                  <Button
                    className="bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer font-medium text-xs"
                    disabled={saving}
                    onClick={handleSave}
                  >
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </>
              ) : (
                <Button
                  className="bg-emerald-700 hover:bg-emerald-800 text-white cursor-pointer font-medium text-xs"
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
