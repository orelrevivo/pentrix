import React, { useState, useEffect } from "react";
import { ArrowLeft, Save, Sparkles, Loader2, Upload, Bold, Italic, Link2, Code, Image as ImageIcon, X } from "lucide-react";
import { PLANS } from "./PlanSelector";
import { PayPalCheckout } from "./PayPalCheckout";
import { Button, Input, Textarea, Label, Select } from "./ui";

interface Project {
  id: string;
  name: string;
  tagline: string;
  description: string;
  websiteUrl: string;
  logoUrl: string;
  screenshotUrl?: string;
  founderName: string;
  category: string;
  status: string;
  lookingFor: string;
  plan: string;
  isPublished: boolean;
}

interface EditProjectFormProps {
  project: Project;
  onBack: () => void;
  onSuccess: () => void;
}

export const EditProjectForm: React.FC<EditProjectFormProps> = ({ project, onBack, onSuccess }) => {
  const [formData, setFormData] = useState({
    name: project.name,
    tagline: project.tagline,
    description: project.description,
    websiteUrl: project.websiteUrl,
    logoUrl: project.logoUrl,
    founderName: project.founderName,
    category: project.category,
    status: project.status,
    lookingFor: project.lookingFor,
    isPublished: project.isPublished,
  });
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [selectedPlan, setSelectedPlan] = useState(project.plan);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showUpgradeCheckout, setShowUpgradeCheckout] = useState(false);

  useEffect(() => {
    try {
      if (project.screenshotUrl) {
        if (project.screenshotUrl.trim().startsWith("[")) {
          setScreenshots(JSON.parse(project.screenshotUrl));
        } else {
          setScreenshots([project.screenshotUrl]);
        }
      }
    } catch (e) {
      setScreenshots(project.screenshotUrl ? [project.screenshotUrl] : []);
    }
  }, [project.screenshotUrl]);

  const getScreenshotLimit = (plan: string) => {
    if (plan === "small") return 3;
    if (plan === "builder") return 5;
    return 10;
  };

  const getPlanPrice = (plan: string) => PLANS.find((p) => p.id === plan)?.price || 0;
  const currentPrice = getPlanPrice(project.plan);
  const selectedPrice = getPlanPrice(selectedPlan);
  const upgradeCost = Math.max(0, selectedPrice - currentPrice);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData({ ...formData, [name]: checked });
    } else {
      setFormData({ ...formData, [name]: value });
    }
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
    const textarea = document.getElementById("edit-desc") as HTMLTextAreaElement;
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

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const limit = getScreenshotLimit(selectedPlan);
    const finalScreenshots = screenshots.slice(0, limit);

    try {
      const res = await fetch(`/api/dashboard/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          screenshotUrl: JSON.stringify(finalScreenshots),
          plan: selectedPlan === project.plan ? undefined : undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        if (selectedPlan !== project.plan && upgradeCost > 0) {
          setShowUpgradeCheckout(true);
        } else {
          onSuccess();
        }
      } else {
        setError(data.error || "Failed to update project details.");
      }
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleUpgradeSuccess = async () => {
    try {
      const res = await fetch(`/api/dashboard/projects/${project.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plan: selectedPlan,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowUpgradeCheckout(false);
        onSuccess();
      } else {
        setError("Plan update failed after payment capture.");
      }
    } catch (err) {
      setError("Failed to finalize plan upgrade.");
    }
  };

  return (
    <div className="max-w-3xl mx-auto bg-zinc-950 border border-border-custom rounded-2xl p-6 shadow-xl text-foreground">
      <div className="flex items-center justify-between mb-6 border-b border-border-custom pb-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onBack}
          className="gap-1.5 text-zinc-400 hover:text-white"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Dashboard
        </Button>
        <h2 className="text-xl font-bold text-white">Edit {project.name}</h2>
      </div>

      {error && (
        <div className="mb-6 rounded-lg bg-rose-500/10 border border-rose-500/20 p-3 text-sm text-rose-450">
          {error}
        </div>
      )}

      {showUpgradeCheckout ? (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-lg font-bold text-white">Upgrade Spot Plan</h3>
            <p className="text-xs text-zinc-400 mt-1">Pay the difference to upgrade from {project.plan} to {selectedPlan}.</p>
          </div>
          <PayPalCheckout
            amount={upgradeCost}
            projectId={project.id}
            planType={selectedPlan}
            onSuccess={handleUpgradeSuccess}
            onCancel={() => setShowUpgradeCheckout(false)}
          />
        </div>
      ) : (
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="mb-2 block">Project Name</Label>
              <Input
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
              />
            </div>
            <div>
              <Label className="mb-2 block">One-line Tagline</Label>
              <Input
                name="tagline"
                required
                value={formData.tagline}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <Label className="mb-1 block">Description</Label>
            <div className="flex gap-1 bg-zinc-900 border border-border-custom p-1 rounded-t-lg border-b-0">
              <button type="button" onClick={() => insertMarkdown("**", "**")} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white"><Bold className="h-3.5 w-3.5" /></button>
              <button type="button" onClick={() => insertMarkdown("*", "*")} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white"><Italic className="h-3.5 w-3.5" /></button>
              <button type="button" onClick={() => insertMarkdown("[", "](https://)")} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white"><Link2 className="h-3.5 w-3.5" /></button>
              <button type="button" onClick={() => insertMarkdown("`", "`")} className="p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white"><Code className="h-3.5 w-3.5" /></button>
            </div>
            <Textarea
              id="edit-desc"
              name="description"
              required
              rows={4}
              value={formData.description}
              onChange={handleChange}
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
              />
            </div>
            <div>
              <Label className="mb-2 block">Logo Image</Label>
              <div className="flex items-center gap-3">
                {formData.logoUrl && (
                  <img src={formData.logoUrl} alt="Logo Preview" className="h-10 w-10 rounded-lg object-cover border border-border-custom bg-zinc-900" />
                )}
                <label className="flex-grow flex items-center justify-center gap-2 rounded-lg border border-dashed border-border-custom hover:border-primary-500 bg-zinc-900/30 p-2.5 text-xs text-zinc-400 hover:text-white cursor-pointer transition-colors">
                  <Upload className="h-4 w-4" />
                  <span>Upload Logo File</span>
                  <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                </label>
              </div>
            </div>
          </div>

          <div>
            <Label className="mb-2 block">
              Screenshots (Limit: {getScreenshotLimit(selectedPlan)} images)
            </Label>
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
                <label className="flex flex-col items-center justify-center aspect-video rounded-lg border border-dashed border-border-custom hover:border-primary-500 bg-zinc-900/30 text-zinc-400 hover:text-white cursor-pointer transition-colors">
                  <ImageIcon className="h-5 w-5 mb-1" />
                  <span className="text-[10px]">Add Screenshot</span>
                  <input type="file" accept="image/*" multiple onChange={handleScreenshotUpload} className="hidden" />
                </label>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="mb-2 block">Founder Name</Label>
              <Input
                name="founderName"
                required
                value={formData.founderName}
                onChange={handleChange}
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
            <div>
              <Label className="mb-2 block">Spot Plan</Label>
              <Select
                name="plan"
                value={selectedPlan}
                onChange={(e) => setSelectedPlan(e.target.value)}
              >
                <option value="small">Small Spot ($1)</option>
                <option value="builder">Builder Spot ($5)</option>
                <option value="featured">Featured Spot ($20)</option>
                <option value="premium">Premium Spot ($50)</option>
              </Select>
            </div>
          </div>

          <div className="flex items-center gap-2 border-t border-border-custom pt-4">
            <input
              type="checkbox"
              id="isPublished"
              name="isPublished"
              checked={formData.isPublished}
              onChange={handleChange}
              className="rounded border-border-custom text-primary-600 focus:ring-primary-500"
            />
            <label htmlFor="isPublished" className="text-sm font-semibold text-zinc-300">
              Publish project publicly on the live canvas
            </label>
          </div>

          <div className="flex justify-end gap-3 pt-6 border-t border-border-custom">
            <Button variant="outline" type="button" onClick={onBack}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="gap-1.5"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : selectedPlan !== project.plan && upgradeCost > 0 ? (
                <>
                  <Sparkles className="h-4 w-4" />
                  <span>Upgrade & Save (+${upgradeCost})</span>
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  <span>Save Changes</span>
                </>
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};
