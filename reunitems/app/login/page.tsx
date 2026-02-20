"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Home } from "lucide-react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged,
} from "firebase/auth";
import { doc, addDoc, collection, serverTimestamp, GeoPoint } from "firebase/firestore";
import { firebaseAuth, firebaseDb } from "@/lib/firebaseClient";
import {
  createOrUpdateUser,
  getUserOrganizations,
  addMember,
  getAllOrganizations,
  type Organization,
} from "@/lib/firebaseHelpers";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registerOrg = searchParams.get("registerOrg") === "1";

  const [currentUser, setCurrentUser] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignUp, setIsSignUp] = useState(registerOrg);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState("");
  const [applyAsRole, setApplyAsRole] = useState<"admin" | "regular">("regular");
  const [newOrgName, setNewOrgName] = useState("");
  const [newOrgAddress, setNewOrgAddress] = useState("");
  const [newOrgLat, setNewOrgLat] = useState("");
  const [newOrgLng, setNewOrgLng] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(firebaseAuth, setCurrentUser);
    return () => unsub();
  }, []);

  useEffect(() => {
    getAllOrganizations().then(setOrganizations).catch(console.error);
  }, []);

  const redirectToProfile = () => {
    router.replace("/profile");
  };

  const signIn = async () => {
    try {
      const cred = await signInWithEmailAndPassword(firebaseAuth, email, password);
      const user = cred.user;
      if (!user) {
        alert("Unable to sign in. Please try again.");
        return;
      }
      await createOrUpdateUser(user.uid, {
        UserEmail: user.email || "",
        UserName: user.displayName || user.email || undefined,
      });
      const userOrgs = await getUserOrganizations(user.uid);
      if (userOrgs.length > 0 && typeof window !== "undefined") {
        localStorage.setItem("currentOrgId", userOrgs[0].orgId);
      }
      redirectToProfile();
    } catch (error: any) {
      console.error(error);
      alert(error?.message || "Failed to sign in.");
    }
  };

  const registerOrganization = async (userId: string) => {
    if (!newOrgName.trim()) {
      alert("Please enter an organization name.");
      return;
    }
    const orgData: Record<string, unknown> = {
      name: newOrgName.trim(),
      Address: newOrgAddress.trim() || undefined,
      AppliedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      OrgApprovalStatus: "pending",
    };
    if (newOrgLat && newOrgLng && !isNaN(Number(newOrgLat)) && !isNaN(Number(newOrgLng))) {
      orgData.LocPoint = new GeoPoint(Number(newOrgLat), Number(newOrgLng));
    }
    const orgRef = await addDoc(collection(firebaseDb, "Organizations"), orgData);
    await addMember(orgRef.id, userId, {
      UserRole: "superadmin",
      ApplicationStatus: "pending",
    });
    if (typeof window !== "undefined") {
      localStorage.setItem("currentOrgId", orgRef.id);
    }
    alert("Organization application submitted! It will appear after approval by the ReunItems team.");
    redirectToProfile();
  };

  const signUp = async () => {
    try {
      if (registerOrg) {
        if (currentUser) {
          await registerOrganization(currentUser.uid);
          return;
        }
        if (!newOrgName.trim()) {
          alert("Please enter an organization name.");
          return;
        }
      } else if (isSignUp && !selectedOrgId) {
        alert("Please select an organization.");
        return;
      }

      const cred = await createUserWithEmailAndPassword(firebaseAuth, email, password);
      const user = cred.user;
      if (!user) {
        alert("Sign up failed.");
        return;
      }
      await createOrUpdateUser(user.uid, {
        UserEmail: user.email || "",
        UserName: user.displayName || user.email || undefined,
      });

      if (registerOrg && newOrgName.trim()) {
        await registerOrganization(user.uid);
        return;
      }

      if (selectedOrgId) {
        await addMember(selectedOrgId, user.uid, {
          UserRole: applyAsRole,
          ApplicationStatus: "pending",
        });
        if (typeof window !== "undefined") {
          localStorage.setItem("currentOrgId", selectedOrgId);
        }
        alert("Application submitted! An admin will approve your access.");
      }
      redirectToProfile();
    } catch (error: any) {
      console.error(error);
      alert(error?.message || "Failed to sign up.");
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const cred = await signInWithPopup(firebaseAuth, provider);
      const user = cred.user;
      if (!user) return;
      await createOrUpdateUser(user.uid, {
        UserEmail: user.email || "",
        UserName: user.displayName || user.email || undefined,
      });
      const userOrgs = await getUserOrganizations(user.uid);
      if (userOrgs.length > 0 && typeof window !== "undefined") {
        localStorage.setItem("currentOrgId", userOrgs[0].orgId);
      }
      redirectToProfile();
    } catch (error: any) {
      console.error(error);
      alert(error?.message || "Google sign-in failed.");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (registerOrg && currentUser) {
      registerOrganization(currentUser.uid);
      return;
    }
    if (isSignUp) signUp();
    else signIn();
  };

  const isRegisterOrgOnly = registerOrg && currentUser;

  return (
    <div className="min-h-screen bg-[#AEC0F3] flex flex-col font-sans">
      <header className="p-6 flex justify-between items-center w-full max-w-6xl mx-auto">
        <Link href="/" className="flex items-center gap-2 text-[#1E1B4B] hover:text-white transition group">
          <Home className="w-6 h-6 group-hover:scale-110 transition-transform" />
          <span className="font-bold text-lg">Back to Home</span>
        </Link>
        <h1 className="text-2xl font-extrabold text-[#1E1B4B]">ReunItems</h1>
      </header>

      <main className="flex-1 flex items-center justify-center px-4 pb-20">
        <div className="bg-white rounded-3xl shadow-xl w-full max-w-md p-8 md:p-12 text-center">
          <h2 className="text-3xl font-bold text-[#1E1B4B] mb-4">
            {isRegisterOrgOnly
              ? "Register your organization"
              : registerOrg
                ? "Sign up & register organization"
                : isSignUp
                  ? "Sign up"
                  : "Log in"}
          </h2>
          {isRegisterOrgOnly && (
            <p className="text-sm text-gray-600 mb-4">
              You’re signed in as {currentUser?.email}. Submitting will create an organization that goes through approval.
            </p>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-6 text-left">
            {!isRegisterOrgOnly && (
              <>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email"
                  type="email"
                  className="p-3 rounded-xl border w-full"
                  required={!registerOrg}
                />
                <input
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Password"
                  type="password"
                  className="p-3 rounded-xl border w-full"
                  required={!registerOrg}
                />
              </>
            )}

            {(registerOrg || isRegisterOrgOnly) && (
              <>
                <input
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="Organization name *"
                  className="p-3 rounded-xl border w-full"
                  required
                />
                <input
                  value={newOrgAddress}
                  onChange={(e) => setNewOrgAddress(e.target.value)}
                  placeholder="Address (street, city, state, zip)"
                  className="p-3 rounded-xl border w-full"
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    value={newOrgLat}
                    onChange={(e) => setNewOrgLat(e.target.value)}
                    placeholder="Latitude (optional)"
                    type="text"
                    className="p-3 rounded-xl border w-full"
                  />
                  <input
                    value={newOrgLng}
                    onChange={(e) => setNewOrgLng(e.target.value)}
                    placeholder="Longitude (optional)"
                    type="text"
                    className="p-3 rounded-xl border w-full"
                  />
                </div>
              </>
            )}

            {isSignUp && !registerOrg && organizations.length > 0 && (
              <>
                <label className="text-sm font-medium text-gray-700">Apply to organization</label>
                <select
                  value={selectedOrgId}
                  onChange={(e) => setSelectedOrgId(e.target.value)}
                  className="p-3 rounded-xl border w-full"
                  required
                >
                  <option value="">Select organization</option>
                  {organizations.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name || org.id}
                    </option>
                  ))}
                </select>
                <label className="text-sm font-medium text-gray-700">Apply as</label>
                <select
                  value={applyAsRole}
                  onChange={(e) => setApplyAsRole(e.target.value as "admin" | "regular")}
                  className="p-3 rounded-xl border w-full"
                >
                  <option value="regular">Student</option>
                  <option value="admin">Admin</option>
                </select>
              </>
            )}

            <div className="flex gap-3">
              <button type="submit" className="flex-1 bg-[#1E1B4B] text-white py-3 rounded-xl">
                {isRegisterOrgOnly ? "Submit application" : isSignUp ? "Sign up" : "Sign in"}
              </button>
            </div>
          </form>

          {!isRegisterOrgOnly && (
            <>
              <button onClick={signInWithGoogle} className="mt-2 underline text-sm w-full">
                Sign in with Google
              </button>
              <button
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  if (registerOrg) router.replace("/login");
                }}
                className="text-sm text-gray-500 mt-4"
              >
                {isSignUp ? "Already have an account? Log in" : "Don't have an account? Sign up"}
              </button>
            </>
          )}

          {isSignUp && !registerOrg && (
            <p className="text-xs text-gray-500 mt-2">
              Don't see your organization?{" "}
              <Link href="/schoolfind" className="text-indigo-600 underline">
                Find your organization
              </Link>{" "}
              and click &quot;Register your organization&quot;.
            </p>
          )}
        </div>
      </main>
    </div>
  );
}
