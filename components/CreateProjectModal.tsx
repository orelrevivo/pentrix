import React, { useState, useEffect } from "react";
import { X, ArrowRight, ArrowLeft, Upload, Bold, Italic, Link2, Code, Image as ImageIcon } from "lucide-react";
import { PlanSelector, PLANS } from "./PlanSelector";
import { PayPalCheckout } from "./PayPalCheckout";
import { Button, Input, Textarea, Label, Select } from "./ui";

interface CreateProjectModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateProjectModal: React.FC<CreateProjectModalProps> = ({ onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [projectId, setProjectId] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    tagline: "",
    description: "",
    websiteUrl: "",
    logoUrl: "",
    founderName: "",
    category: "SaaS",
    status: "Building now",
    lookingFor: "feedback",
    email: "",
    password: "",
  });
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [selectedPlan, setSelectedPlan] = useState("small");
  const [balance, setBalance] = useState(0);
  const [payingWithCredit, setPayingWithCredit] = useState(false);
  const [couponInput, setCouponInput] = useState("");
  const [validatingCoupon, setValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState("");

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setValidatingCoupon(true);
    setCouponError("");
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          couponCode: couponInput.trim(),
          planType: selectedPlan,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAppliedCoupon(couponInput.trim());
        setCouponInput("");
      } else {
        setCouponError(data.error || "Invalid coupon code");
      }
    } catch (e) {
      setCouponError("Failed to validate coupon");
    } finally {
      setValidatingCoupon(false);
    }
  };


  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.authenticated) {
          return fetch(`/api/users/balance`);
        }
        return null;
      })
      .then((res) => {
        if (res) return res.json();
      })
      .then((data) => {
        if (data?.success) {
          setBalance(parseFloat(data.balance));
        }
      })
      .catch(() => {});
  }, []);

  const getScreenshotLimit = (plan: string) => {
    if (plan === "small") return 3;
    if (plan === "builder") return 5;
    return 10;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, logoUrl: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleScreenshotUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const limit = getScreenshotLimit(selectedPlan);
    const availableSlots = limit - screenshots.length;
    const filesToUpload = files.slice(0, availableSlots);

    filesToUpload.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshots((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeScreenshot = (idx: number) => {
    setScreenshots((prev) => prev.filter((_, i) => i !== idx));
  };

  const insertMarkdown = (before: string, after: string) => {
    const textarea = document.getElementById("create-desc") as HTMLTextAreaElement;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = formData.description;
    const selected = text.substring(start, end);
    const updatedValue = text.substring(0, start) + before + selected + after + text.substring(end);
    setFormData((prev) => ({ ...prev, description: updatedValue }));
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selected.length);
    }, 50);
  };

  const handleNext = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step === 1) {
      if (!formData.logoUrl) {
        setError("Please upload a logo.");
        return;
      }
      setStep(2);
    } else if (step === 2) {
      setLoading(true);
      setError("");

      const limit = getScreenshotLimit(selectedPlan);
      const finalScreenshots = screenshots.slice(0, limit);

      try {
        const res = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            screenshotUrl: JSON.stringify(finalScreenshots),
            plan: selectedPlan,
          }),
        });
        const data = await res.json();
        if (data.success) {
          setProjectId(data.project.id);
          setStep(3);
        } else {
          setError(data.error || "Failed to create project draft.");
        }
      } catch (err) {
        setError("Network error. Please try again.");
      } finally {
        setLoading(false);
      }
    }
  };

  const currentPlanObj = PLANS.find((p) => p.id === selectedPlan);
  const isCouponValid = appliedCoupon && appliedCoupon.toUpperCase() === "EARLYBUILDER" && selectedPlan === "small";
  const price = isCouponValid ? 0 : (currentPlanObj ? currentPlanObj.price : 1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-2xl border border-border-custom bg-card p-6 shadow-2xl animate-in zoom-in-95 duration-150 text-foreground">
        <div className="flex items-center justify-between border-b border-border-custom pb-4 mb-6">
          <div>
            <h2 className="text-xl font-bold text-foreground">Create Your Spot</h2>
            <p className="text-xs text-zinc-500">Step {step} of 3: {step === 1 ? "Project Info" : step === 2 ? "Select Plan" : "Checkout"}</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-8 w-8 text-zinc-500 hover:text-foreground hover:bg-card-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-sm text-rose-450">
            {error}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleNext} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block">Project Name</Label>
                <Input
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="e.g. BuildBoard"
                />
              </div>
              <div>
                <Label className="mb-2 block">One-line Tagline</Label>
                <Input
                  name="tagline"
                  required
                  value={formData.tagline}
                  onChange={handleChange}
                  placeholder="Buy a spot on the live builder canvas"
                />
              </div>
            </div>

            <div>
              <Label className="mb-1 block">Description</Label>
              <div className="flex gap-1 bg-card-muted border border-border-custom p-1 rounded-t-lg border-b-0">
                <button type="button" onClick={() => insertMarkdown("**", "**")} className="p-1 hover:bg-card rounded text-zinc-500 hover:text-foreground"><Bold className="h-3.5 w-3.5" /></button>
                <button type="button" onClick={() => insertMarkdown("*", "*")} className="p-1 hover:bg-card rounded text-zinc-500 hover:text-foreground"><Italic className="h-3.5 w-3.5" /></button>
                <button type="button" onClick={() => insertMarkdown("[", "](https://)")} className="p-1 hover:bg-card rounded text-zinc-500 hover:text-foreground"><Link2 className="h-3.5 w-3.5" /></button>
                <button type="button" onClick={() => insertMarkdown("`", "`")} className="p-1 hover:bg-card rounded text-zinc-500 hover:text-foreground"><Code className="h-3.5 w-3.5" /></button>
              </div>
              <Textarea
                id="create-desc"
                name="description"
                required
                rows={4}
                value={formData.description}
                onChange={handleChange}
                placeholder="Describe your product... Use toolbar to format description."
                className="rounded-t-none"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label className="mb-2 block">Website URL</Label>
                <Input
                  name="websiteUrl"
                  required
                  value={formData.websiteUrl}
                  onChange={handleChange}
                  placeholder="https://myproject.com"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Logo Image</label>
                <div className="flex items-center gap-3">
                  {formData.logoUrl && (
                    <img src={formData.logoUrl} alt="Logo Preview" className="h-10 w-10 rounded-lg object-cover border border-border-custom bg-card-muted" />
                  )}
                  <label className="flex-grow flex items-center justify-center gap-2 rounded-lg border border-dashed border-border-custom hover:border-primary-500 bg-card-muted p-2.5 text-xs text-zinc-500 hover:text-foreground cursor-pointer transition-colors">
                    <Upload className="h-4 w-4" />
                    <span>Upload Logo File</span>
                    <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                  </label>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">
                Screenshots (Limit: {getScreenshotLimit(selectedPlan)} images)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-3">
                {screenshots.map((src, idx) => (
                  <div key={idx} className="relative group aspect-video rounded-lg overflow-hidden border border-border-custom bg-zinc-900">
                    <img src={src} alt={`Preview ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => removeScreenshot(idx)}
                      className="absolute top-1 right-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/90 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
                {screenshots.length < getScreenshotLimit(selectedPlan) && (
                  <label className="flex flex-col items-center justify-center aspect-video rounded-lg border border-dashed border-border-custom hover:border-primary-500 bg-card-muted text-zinc-500 hover:text-foreground cursor-pointer transition-colors">
                    <ImageIcon className="h-5 w-5 mb-1" />
                    <span className="text-[10px]">Add Screenshot</span>
                    <input type="file" accept="image/*" multiple onChange={handleScreenshotUpload} className="hidden" />
                  </label>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Label className="mb-2 block">Founder Name</Label>
                <Input
                  name="founderName"
                  required
                  value={formData.founderName}
                  onChange={handleChange}
                  placeholder="Alex Rivera"
                />
              </div>
              <div>
                <Label className="mb-2 block">Category</Label>
                <Select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                >
                  <option value="SaaS">SaaS</option>
                  <option value="Mobile App">Mobile App</option>
                  <option value="AI Tool">AI Tool</option>
                  <option value="Developer Tool">DevTool</option>
                  <option value="Community">Community</option>
                  <option value="Design">Design</option>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block">Status</Label>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                >
                  <option value="Building now">Building now</option>
                  <option value="Live">Live</option>
                  <option value="Looking for feedback">Looking for feedback</option>
                  <option value="Looking for users">Looking for users</option>
                  <option value="Paused">Paused</option>
                  <option value="Not working right now">Not working right now</option>
                </Select>
              </div>
              <div>
                <Label className="mb-2 block">Looking For</Label>
                <Select
                  name="lookingFor"
                  value={formData.lookingFor}
                  onChange={handleChange}
                >
                  <option value="feedback">Feedback</option>
                  <option value="users">Users</option>
                  <option value="first customer">First Customer</option>
                  <option value="cofounder">Cofounder</option>
                  <option value="supporters">Supporters</option>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-border-custom pt-4">
              <div>
                <Label className="mb-2 block">Owner Email</Label>
                <Input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="you@domain.com"
                />
              </div>
              <div>
                <Label className="mb-2 block">Dashboard Password</Label>
                <Input
                  type="password"
                  name="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border-custom">
              <Button variant="outline" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                Choose Plan
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          </form>
        )}

        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Coupon Code Input */}
            <div className="p-4 rounded-xl border border-border-custom bg-card-muted flex flex-col sm:flex-row items-end gap-3">
              <div className="flex-grow">
                <Label className="mb-2 block">Coupon Code</Label>
                <Input
                  type="text"
                  placeholder="Enter coupon code (e.g. EARLYBUILDER)"
                  value={couponInput}
                  onChange={(e) => {
                    setCouponInput(e.target.value);
                    setCouponError("");
                  }}
                  className="w-full"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                onClick={handleApplyCoupon}
                disabled={validatingCoupon || !couponInput.trim()}
                className="w-full sm:w-auto shrink-0"
              >
                {validatingCoupon ? "Applying..." : "Apply Coupon"}
              </Button>
            </div>
            {couponError && (
              <p className="text-xs text-rose-500 font-semibold mt-1">{couponError}</p>
            )}
            {appliedCoupon && (
              <p className="text-xs text-emerald-500 font-semibold mt-1">
                Coupon "{appliedCoupon}" applied successfully! The Small Spot is now FREE!
              </p>
            )}

            <PlanSelector selectedPlan={selectedPlan} onSelectPlan={setSelectedPlan} couponApplied={!!appliedCoupon} />
            <div className="flex justify-between items-center pt-6 border-t border-border-custom">
              <Button variant="outline" type="button" onClick={() => setStep(1)}>
                <ArrowLeft className="mr-1.5 h-4 w-4" />
                Back to Details
              </Button>
              <Button onClick={handleNext} disabled={loading}>
                {loading ? "Creating Draft..." : "Proceed to Checkout"}
                <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (() => {
          const creditDeduction = Math.min(balance, price);
          const amountToPay = price - creditDeduction;

          const handleCreditPayment = async () => {
            setPayingWithCredit(true);
            setError("");
            try {
              const res = await fetch("/api/payments/credit", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  projectId,
                  planType: selectedPlan,
                  couponCode: appliedCoupon,
                }),
              });
              const data = await res.json();
              if (data.success) {
                onSuccess();
              } else {
                setError(data.error || "Failed to process credit payment");
              }
            } catch (err) {
              setError("Network error. Please try again.");
            } finally {
              setPayingWithCredit(false);
            }
          };

          return (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="text-center py-2">
                <h3 className="text-lg font-bold text-foreground">Select payment method to publish</h3>
                <p className="text-xs text-zinc-500 mt-1">Your spot is currently saved as a draft. Pay to show it live on the board.</p>
              </div>

              <div className="max-w-md mx-auto p-4 rounded-xl border border-border-custom bg-card-muted space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-zinc-500">Plan Price:</span>
                  <span className="font-semibold">${price.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm text-emerald-600 dark:text-emerald-400">
                  <span>Available Credits:</span>
                  <span>-${creditDeduction.toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-border-custom pt-2 text-base font-bold">
                  <span>Total to Pay:</span>
                  <span>${amountToPay.toFixed(2)}</span>
                </div>
              </div>

              {amountToPay === 0 ? (
                <div className="max-w-md mx-auto">
                  <Button
                    disabled={payingWithCredit}
                    onClick={handleCreditPayment}
                    className="w-full py-3"
                  >
                    {payingWithCredit ? "Processing Payment..." : isCouponValid ? "Claim Free Spot" : `Pay Entirely with Credits ($${price.toFixed(2)})`}
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {creditDeduction > 0 && (
                    <p className="text-center text-xs text-zinc-500">
                      Credits of ${creditDeduction.toFixed(2)} will be deducted upon successful PayPal checkout.
                    </p>
                  )}
                  <PayPalCheckout
                    amount={amountToPay}
                    projectId={projectId}
                    planType={selectedPlan}
                    onSuccess={onSuccess}
                    onCancel={onClose}
                  />
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
};
