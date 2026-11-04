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
    <main className="min-h-screen bg-green-50">
      <Navbar />

      <section className="py-12 px-6 text-center bg-green-100">
        <h1 className="text-3xl font-bold text-green-800 mb-2">My Profile</h1>
        <p className="text-gray-700">View and update your verified profile details anytime.</p>
      </section>

      <section className="py-10 px-6 flex justify-center">
        <Card className="w-full max-w-lg bg-white shadow-md rounded-xl hover:shadow-lg transition-all border border-green-100">
          <CardContent className="p-6">
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
