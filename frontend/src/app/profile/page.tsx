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
    <main className="min-h-screen bg-[#F9FAF8] text-[#1F2923]">
      <Navbar />

      <section className="relative overflow-hidden pt-12 pb-12 px-6 lg:px-12 border-b border-emerald-950/6 bg-gradient-to-b from-emerald-50/50 via-[#F9FAF8] to-[#F9FAF8]">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-emerald-50 rounded-full text-xs font-semibold text-emerald-800 border border-emerald-200/60 mb-3 shadow-2xs">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            Verified Platform Identity
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-2">My Profile</h1>
          <p className="text-base text-gray-600 max-w-md mx-auto leading-relaxed">
            Manage your FoodShare credentials, contact channels, and delivery hub locations.
          </p>
        </div>
      </section>

      <section className="py-10 px-6 flex justify-center">
        <Card className="w-full max-w-lg bg-white shadow-premium rounded-2xl border border-emerald-950/8">
          <CardContent className="p-8">
            <div className="space-y-4">
              <div>
                <Label className="block text-sm font-medium text-gray-700 capitalize mb-1">
                  Full Name
                </Label>
                {isEditing ? (
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full"
                  />
                ) : (
                  <p className="text-gray-800 p-2 bg-gray-50 rounded border border-gray-100 font-medium">
                    {profile.name}
                  </p>
                )}
              </div>

              <div>
                <Label className="block text-sm font-medium text-gray-700 capitalize mb-1">
                  Email Address
                </Label>
                <p className="text-gray-800 p-2 bg-gray-100 rounded border border-gray-150 text-sm">
                  {profile.email}
                </p>
              </div>

              <div>
                <Label className="block text-sm font-medium text-gray-700 capitalize mb-1">
                  Role
                </Label>
                <p className="text-green-800 p-2 bg-green-50 rounded border border-green-200 text-sm font-semibold">
                  {profile.role}
                </p>
              </div>

              <div>
                <Label className="block text-sm font-medium text-gray-700 capitalize mb-1">
                  Phone Number
                </Label>
                {isEditing ? (
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full"
                  />
                ) : (
                  <p className="text-gray-800 p-2 bg-gray-50 rounded border border-gray-100 font-medium">
                    {profile.phone}
                  </p>
                )}
              </div>

              <div>
                <Label className="block text-sm font-medium text-gray-700 capitalize mb-1">
                  Organization / Address
                </Label>
                {isEditing ? (
                  <Input
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full"
                  />
                ) : (
                  <p className="text-gray-800 p-2 bg-gray-50 rounded border border-gray-100 font-medium">
                    {profile.address}
                  </p>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-100">
                {isEditing ? (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setFormData(profile);
                        setIsEditing(false);
                      }}
                      className="cursor-pointer"
                    >
                      Cancel
                    </Button>
                    <Button
                      className="bg-green-700 hover:bg-green-800 text-white cursor-pointer font-semibold"
                      disabled={saving}
                      onClick={handleSave}
                    >
                      {saving ? "Saving..." : "Save Changes"}
                    </Button>
                  </>
                ) : (
                  <Button
                    className="bg-green-700 hover:bg-green-800 text-white cursor-pointer font-semibold"
                    onClick={handleEdit}
                  >
                    Edit Profile
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      </section>
    </main>
  );
}
