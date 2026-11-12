import React, { useRef, useEffect } from 'react';
import type { IssueTypeSelection } from '../types/report.ts';
import { AlertCircle, Ban, Wrench, ShieldAlert, MoreHorizontal } from 'lucide-react';

interface Section1Props {
  issueTypes: IssueTypeSelection;
  onChangeIssueTypes: (newTypes: IssueTypeSelection) => void;
  description: string;
  onChangeDescription: (desc: string) => void;
  errors: {
    issueTypes?: string;
    description?: string;
  };
}

export const Section1IssueType: React.FC<Section1Props> = ({
  issueTypes,
  onChangeIssueTypes,
  description,
  onChangeDescription,
  errors,
}) => {
  const otherInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (issueTypes.other && otherInputRef.current) {
      otherInputRef.current.focus();
    }
  }, [issueTypes.other]);

  const toggleType = (key: keyof IssueTypeSelection) => {
    if (key === 'otherText') return;
    onChangeIssueTypes({
      ...issueTypes,
      [key]: !issueTypes[key],
    });
  };

  const setOtherText = (text: string) => {
    onChangeIssueTypes({
      ...issueTypes,
      otherText: text,
    });
  };

  return (
    <section aria-labelledby="section-1-heading" className="space-y-7">
      <div className="border-b border-[#D0D7DE] pb-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#005087]">
          <span>Section 1 of 3</span>
        </div>
        <h2 id="section-1-heading" className="text-xl font-bold text-[#193A5A] mt-1">
          Rental E-Scooter or E-Bike Issue Reporting
        </h2>
        <p className="text-xs text-[#767676] mt-0.5">
          Select the categories that apply to this situation and describe the condition.
        </p>
      </div>

      {/* Question 1: Type of issue */}
      <fieldset className="space-y-3">
        <legend className="block w-full">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-[#193A5A] flex items-center gap-1.5">
              1. Type of issue <span className="text-[#C62828]" aria-hidden="true">*</span>
            </span>
            <span className="text-xs text-[#767676] font-normal">
              Select all that apply
            </span>
          </div>
          <span className="sr-only">Select all issue types that apply</span>
        </legend>

        {errors.issueTypes && (
          <div className="flex items-center gap-2 text-xs font-semibold text-[#C62828] bg-[#FDE8E8] border border-[#F8B4B4] rounded-md p-3">
            <AlertCircle className="h-4 w-4 shrink-0 text-[#C62828]" />
            <span>{errors.issueTypes}</span>
          </div>
        )}

        <div className="space-y-2.5 pt-1">
          {/* Option 1: Improper Parking */}
          <label
            className={`flex items-start gap-3.5 p-3.5 rounded-md border transition-all cursor-pointer ${
              issueTypes.improperParking
                ? 'border-[#005087] bg-[#E8F1F6] shadow-xs'
                : 'border-[#D0D7DE] bg-white hover:border-[#0081BC] hover:bg-[#F3F5F7]'
            }`}
          >
            <input
              type="checkbox"
              checked={issueTypes.improperParking}
              onChange={() => toggleType('improperParking')}
              className="mt-0.5 h-4.5 w-4.5 rounded-xs border-[#D0D7DE] text-[#005087] focus:ring-[#0081BC] cursor-pointer accent-[#005087]"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Ban className={`h-4 w-4 ${issueTypes.improperParking ? 'text-[#005087]' : 'text-[#767676]'}`} />
                <span className="text-sm font-bold text-[#193A5A]">
                  Improper Parking
                </span>
              </div>
              <p className="text-xs text-[#444444] mt-0.5 leading-relaxed">
                E-scooters or e-bikes blocking sidewalks, ramps, or other critical areas.
              </p>
            </div>
          </label>

          {/* Option 2: Damage or Malfunction */}
          <label
            className={`flex items-start gap-3.5 p-3.5 rounded-md border transition-all cursor-pointer ${
              issueTypes.damageMalfunction
                ? 'border-[#005087] bg-[#E8F1F6] shadow-xs'
                : 'border-[#D0D7DE] bg-white hover:border-[#0081BC] hover:bg-[#F3F5F7]'
            }`}
          >
            <input
              type="checkbox"
              checked={issueTypes.damageMalfunction}
              onChange={() => toggleType('damageMalfunction')}
              className="mt-0.5 h-4.5 w-4.5 rounded-xs border-[#D0D7DE] text-[#005087] focus:ring-[#0081BC] cursor-pointer accent-[#005087]"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <Wrench className={`h-4 w-4 ${issueTypes.damageMalfunction ? 'text-[#005087]' : 'text-[#767676]'}`} />
                <span className="text-sm font-bold text-[#193A5A]">
                  Damage or Malfunction
                </span>
              </div>
              <p className="text-xs text-[#444444] mt-0.5 leading-relaxed">
                Broken, damaged, or malfunctioning equipment.
              </p>
            </div>
          </label>

          {/* Option 3: Safety Concerns */}
          <label
            className={`flex items-start gap-3.5 p-3.5 rounded-md border transition-all cursor-pointer ${
              issueTypes.safetyConcerns
                ? 'border-[#005087] bg-[#E8F1F6] shadow-xs'
                : 'border-[#D0D7DE] bg-white hover:border-[#0081BC] hover:bg-[#F3F5F7]'
            }`}
          >
            <input
              type="checkbox"
              checked={issueTypes.safetyConcerns}
              onChange={() => toggleType('safetyConcerns')}
              className="mt-0.5 h-4.5 w-4.5 rounded-xs border-[#D0D7DE] text-[#005087] focus:ring-[#0081BC] cursor-pointer accent-[#005087]"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <ShieldAlert className={`h-4 w-4 ${issueTypes.safetyConcerns ? 'text-[#005087]' : 'text-[#767676]'}`} />
                <span className="text-sm font-bold text-[#193A5A]">
                  Safety Concerns
                </span>
              </div>
              <p className="text-xs text-[#444444] mt-0.5 leading-relaxed">
                Unsafe riding, illegal use, or any issue that could affect public safety.
              </p>
            </div>
          </label>

          {/* Option 4: Other */}
          <div
            className={`p-3.5 rounded-md border transition-all ${
              issueTypes.other
                ? 'border-[#005087] bg-[#E8F1F6] shadow-xs'
                : 'border-[#D0D7DE] bg-white hover:border-[#0081BC]'
            }`}
          >
            <label className="flex items-start gap-3.5 cursor-pointer">
              <input
                type="checkbox"
                checked={issueTypes.other}
                onChange={() => toggleType('other')}
                className="mt-0.5 h-4.5 w-4.5 rounded-xs border-[#D0D7DE] text-[#005087] focus:ring-[#0081BC] cursor-pointer accent-[#005087]"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <MoreHorizontal className={`h-4 w-4 ${issueTypes.other ? 'text-[#005087]' : 'text-[#767676]'}`} />
                  <span className="text-sm font-bold text-[#193A5A]">Other</span>
                </div>
                <p className="text-xs text-[#444444] mt-0.5">
                  Specify any other issue not listed above.
                </p>
              </div>
            </label>

            {issueTypes.other && (
              <div className="mt-3 pl-8">
                <label htmlFor="other-issue-input" className="sr-only">
                  Please specify other issue
                </label>
                <input
                  id="other-issue-input"
                  ref={otherInputRef}
                  type="text"
                  value={issueTypes.otherText || ''}
                  onChange={(e) => setOtherText(e.target.value)}
                  placeholder="e.g. Abandoned in park ravine, submerged, vandalized paint"
                  maxLength={120}
                  className="w-full rounded-md border border-[#D0D7DE] bg-white px-3 py-2 text-sm text-[#222222] placeholder:text-[#767676] focus:border-[#005087] focus:outline-hidden focus:ring-2 focus:ring-[#005087]/20"
                />
              </div>
            )}
          </div>
        </div>
      </fieldset>

      {/* Question 2: Description of issue */}
      <div className="space-y-2 pt-2">
        <label htmlFor="issue-description" className="block">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-[#193A5A] flex items-center gap-1.5">
              2. Description of issue <span className="text-[#C62828]" aria-hidden="true">*</span>
            </span>
            <span className="text-xs text-[#767676] font-normal tabular-nums">
              {description.length} / 1000
            </span>
          </div>
          <span className="block text-xs text-[#767676] mt-0.5">
            Clearly state what the problem is (e.g., damaged, improperly parked, abandoned).
          </span>
        </label>

        {errors.description && (
          <div className="flex items-center gap-2 text-xs font-semibold text-[#C62828] bg-[#FDE8E8] border border-[#F8B4B4] rounded-md p-3">
            <AlertCircle className="h-4 w-4 shrink-0 text-[#C62828]" />
            <span>{errors.description}</span>
          </div>
        )}

        <textarea
          id="issue-description"
          rows={4}
          value={description}
          onChange={(e) => onChangeDescription(e.target.value)}
          placeholder="Please describe the issue in detail. For example: 'The scooter is laying on its side blocking the middle of the sidewalk ramp outside the library entrance. Pedestrians using mobility scooters cannot pass.'"
          maxLength={1000}
          className={`w-full rounded-md border bg-white p-3.5 text-sm text-[#222222] placeholder:text-[#767676] transition-colors focus:outline-hidden focus:ring-2 ${
            errors.description
              ? 'border-[#C62828] focus:border-[#C62828] focus:ring-[#C62828]/20'
              : 'border-[#D0D7DE] focus:border-[#005087] focus:ring-[#005087]/20'
          }`}
        />
      </div>
    </section>
  );
};
