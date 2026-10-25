"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authApi } from "@/lib/api-client";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  organization?: string;
  phonenumber?: string;
  area?: string;
  pincode?: string;
  state?: string;
  country?: string;
  accountStatus?: string;
  createdAt?: string;
  updatedAt?: string;
}

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<UserProfile>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await authApi.getMe();
        const user = res.data.user;
        setProfile(user);
        setFormData(user);
      } catch (err) {
        console.error("Error fetching profile:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleEdit = () => {
    setIsEditing(true);
    setError("");
    setSuccess("");
  };

  const handleCancel = () => {
    setFormData(profile || {});
    setIsEditing(false);
    setError("");
    setSuccess("");
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await authApi.updateMe(formData);
      const updatedUser = res.data.user;
      setProfile(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setIsEditing(false);
      setSuccess("Profile updated successfully!");
    } catch (err: any) {
      setError(err.response?.data?.error?.message || "Error updating profile");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </main>
    );
  }

  if (!profile) {
    return (
      <main className="min-h-screen bg-green-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">Unable to load profile. Please log in again.</p>
        </div>
      </main>
    );
  }

  const fields = [
    { key: "name", label: "Name", type: "text" },
    { key: "email", label: "Email", type: "email" },
    { key: "phonenumber", label: "Phone", type: "tel" },
    { key: "organization", label: "Organization", type: "text" },
    { key: "area", label: "Area", type: "text" },
    { key: "pincode", label: "Pincode", type: "text" },
    { key: "state", label: "State", type: "text" },
    { key: "country", label: "Country", type: "text" },
  ];

  return (
    <main className="min-h-screen bg-green-50">
      <Navbar />

      <section className="py-8 px-6 text-center bg-green-100">
        <h1 className="text-3xl font-bold text-green-800 mb-4">My Profile</h1>
        <p className="text-gray-700">View and update your profile details anytime.</p>
      </section>

      <section className="py-8 px-6 flex justify-center">
        <Card className="w-full max-w-lg bg-white shadow-md rounded-xl hover:shadow-lg transition-all">
          <CardContent className="p-6">
            <div className="space-y-4">
              {fields.map((field) => (
                <div key={field.key}>
                  <Label className="block text-sm font-medium text-gray-700 capitalize mb-1">
                    {field.label}
                  </Label>
                  {isEditing ? (
                    <Input
                      type={field.type}
                      value={formData[field.key as keyof UserProfile] as string || ""}
                      onChange={(e) =>
                        setFormData({ ...formData, [field.key]: e.target.value })
                      }
                      className="w-full"
                      disabled={field.key === "email"} // Email shouldn't be editable
                    />
                  ) : (
                    <p className="text-gray-800 p-2 bg-gray-50 rounded">
                      {formData[field.key as keyof UserProfile] as string || "—"}
                    </p>
                  )}
                </div>
              ))}

              {!isEditing && profile.role && (
                <div>
                  <Label className="block text-sm font-medium text-gray-700 capitalize mb-1">
                    Role
                  </Label>
                  <p className="text-gray-800 p-2 bg-gray-50 rounded">
                    <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                      {profile.role}
                    </span>
                  </p>
                </div>
              )}

              {profile.accountStatus && !isEditing && (
                <div>
                  <Label className="block text-sm font-medium text-gray-700 capitalize mb-1">
                    Account Status
                  </Label>
                  <p className="text-gray-800 p-2 bg-gray-50 rounded">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium capitalize">
                      {profile.accountStatus}
                    </span>
                  </p>
                </div>
              )}

              {profile.createdAt && !isEditing && (
                <div>
                  <Label className="block text-sm font-medium text-gray-700 capitalize mb-1">
                    Member Since
                  </Label>
                  <p className="text-gray-800 p-2 bg-gray-50 rounded">
                    {new Date(profile.createdAt).toLocaleDateString()}
                  </p>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 text-red-700 rounded text-sm">
                  {error}
                </div>
              )}
              {success && (
                <div className="p-3 bg-green-50 text-green-700 rounded text-sm">
                  {success}
                </div>
              )}

              <div className="flex justify-end gap-4 mt-6">
                {isEditing ? (
                  <>
                    <Button variant="outline" onClick={handleCancel}>
                      Cancel
                    </Button>
                    <Button
                      className="bg-green-700 hover:bg-green-800 text-white"
                      onClick={handleSave}
                      disabled={saving}
                    >
                      {saving ? "Saving..." : "Save"}
                    </Button>
                  </>
                ) : (
                  <Button
                    className="bg-green-700 hover:bg-green-800 text-white"
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