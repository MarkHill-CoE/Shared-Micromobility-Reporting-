import React, { useState, useRef } from 'react';
import type { VehicleColourOption, FileAttachment } from '../types/report.ts';
import {
  Upload,
  Camera,
  X,
  FileText,
  AlertCircle,
  HelpCircle,
  Check,
  Bike,
} from 'lucide-react';

interface Section3Props {
  identifyingColours: VehicleColourOption | string;
  onChangeIdentifyingColours: (val: VehicleColourOption | string) => void;
  vehicleIdNumber: string;
  onChangeVehicleIdNumber: (id: string) => void;
  attachment: FileAttachment | null | undefined;
  onChangeAttachment: (file: FileAttachment | null) => void;
  errors: {
    identifyingColours?: string;
    vehicleIdNumber?: string;
  };
}

export const Section3VehicleDetails: React.FC<Section3Props> = ({
  identifyingColours,
  onChangeIdentifyingColours,
  vehicleIdNumber,
  onChangeVehicleIdNumber,
  attachment,
  onChangeAttachment,
  errors,
}) => {
  const [showIdTip, setShowIdTip] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const colourOptions: {
    id: VehicleColourOption;
    label: string;
    operator: string;
    colorSwatch: string;
  }[] = [
    {
      id: 'Bird - Blue or Black E-Scooters and Blue and Black E-Bikes',
      label: 'Bird - Blue or Black E-Scooters and Blue and Black E-Bikes',
      operator: 'Bird Canada (Licensed Operator)',
      colorSwatch: 'bg-gradient-to-r from-blue-700 to-black',
    },
    {
      id: 'Lime - White and Green E-Scooters and E-Bikes',
      label: 'Lime - White and Green E-Scooters and E-Bikes',
      operator: 'Lime (Licensed Operator)',
      colorSwatch: 'bg-gradient-to-r from-lime-500 via-white to-green-700',
    },
    {
      id: 'Private E-Scooter or E-Bike',
      label: 'Private E-Scooter or E-Bike',
      operator: 'Personal / Privately Owned',
      colorSwatch: 'bg-gradient-to-r from-slate-400 to-slate-700',
    },
  ];

  const handleFileProcess = (file: File) => {
    setUploadError(null);
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setUploadError(`File is too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Please choose an image or video under 10MB.`);
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      onChangeAttachment({
        name: file.name,
        type: file.type,
        size: file.size,
        dataUrl: result,
      });
    };
    reader.onerror = () => {
      setUploadError('Failed to read the file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  return (
    <section aria-labelledby="section-3-heading" className="space-y-7">
      <div className="border-b border-[#D0D7DE] pb-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#005087]">
          <span>Section 3 of 3</span>
        </div>
        <h2 id="section-3-heading" className="text-xl font-bold text-[#193A5A] mt-1">
          Vehicle Details
        </h2>
        <p className="text-xs text-[#767676] mt-0.5">
          Identifying the specific vehicle and operator ensures rapid dispatch to the right municipal crew or vendor.
        </p>
      </div>

      {/* Question 5: Identifying colours */}
      <fieldset className="space-y-3">
        <legend className="block w-full">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-[#193A5A] flex items-center gap-1.5">
              5. Identifying colours <span className="text-[#C62828]" aria-hidden="true">*</span>
            </span>
          </div>
          <span className="block text-xs text-[#767676] mt-0.5">
            Select the brand or colour scheme of the rental device.
          </span>
        </legend>

        {errors.identifyingColours && (
          <div className="flex items-center gap-2 text-xs font-semibold text-[#C62828] bg-[#FDE8E8] border border-[#F8B4B4] rounded-md p-3">
            <AlertCircle className="h-4 w-4 shrink-0 text-[#C62828]" />
            <span>{errors.identifyingColours}</span>
          </div>
        )}

        <div className="space-y-2.5 pt-1">
          {colourOptions.map((opt) => {
            const isSelected = identifyingColours === opt.id;
            return (
              <label
                key={opt.id}
                className={`flex items-start gap-3.5 p-3.5 rounded-md border transition-all cursor-pointer ${
                  isSelected
                    ? 'border-[#005087] bg-[#E8F1F6] shadow-xs'
                    : 'border-[#D0D7DE] bg-white hover:border-[#0081BC] hover:bg-[#F3F5F7]'
                }`}
              >
                <input
                  type="radio"
                  name="identifyingColours"
                  value={opt.id}
                  checked={isSelected}
                  onChange={() => onChangeIdentifyingColours(opt.id)}
                  className="mt-1 h-4.5 w-4.5 border-[#D0D7DE] text-[#005087] focus:ring-[#0081BC] cursor-pointer accent-[#005087]"
                />
                <div className="flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-[#193A5A]">
                      {opt.label}
                    </span>
                    <span
                      aria-hidden="true"
                      className={`h-3 w-8 rounded-full border border-slate-300 shadow-xs shrink-0 ${opt.colorSwatch}`}
                    />
                  </div>
                  <span className="text-xs text-[#767676] mt-0.5 block">
                    Category: {opt.operator}
                  </span>
                </div>
              </label>
            );
          })}
        </div>
      </fieldset>

      {/* Question 6: Vehicle identification number */}
      <div className="space-y-2 pt-2">
        <label htmlFor="vehicle-id-number" className="block">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <span className="text-sm font-bold text-[#193A5A] flex items-center gap-1.5">
              6. Vehicle identification number
            </span>
            <button
              type="button"
              onClick={() => setShowIdTip(!showIdTip)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#005087] hover:text-[#193A5A] hover:underline transition-colors self-start sm:self-auto cursor-pointer"
            >
              <HelpCircle className="h-3.5 w-3.5 text-[#0081BC]" />
              <span>Where is the ID located?</span>
            </button>
          </div>
          <span className="block text-xs text-[#767676] mt-0.5">
            Enter the vehicle's identification number (ID), large alphanumeric numbers typically found on the frame.
          </span>
        </label>

        {showIdTip && (
          <div className="rounded-md border border-[#B6D0E2] bg-[#E8F1F6] p-4 text-xs text-[#222222] space-y-2 transition-all">
            <div className="flex items-center gap-2 font-bold text-[#005087]">
              <Bike className="h-4 w-4 text-[#005087]" />
              <span>City Guidelines: Locating the Device ID</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-[#444444] pl-1">
              <li><strong>E-Scooters:</strong> Printed in bold contrasting font on the front vertical steering stem, on the floorboard grip, or above the rear wheel brake fender.</li>
              <li><strong>E-Bikes:</strong> Stamped or stickered on the main frame downtube, beneath the seat collar, or on the rear battery enclosure.</li>
              <li>Usually 4 to 8 alphanumeric characters (e.g., <code className="bg-white px-1.5 py-0.5 rounded border border-[#D0D7DE] font-mono text-[#005087] font-bold">LM-9821</code> or <code className="bg-white px-1.5 py-0.5 rounded border border-[#D0D7DE] font-mono text-[#005087] font-bold">BRD-44109</code>).</li>
            </ul>
          </div>
        )}

        <div className="relative">
          <input
            id="vehicle-id-number"
            type="text"
            value={vehicleIdNumber}
            onChange={(e) => onChangeVehicleIdNumber(e.target.value.toUpperCase())}
            placeholder="e.g. LM-94821 or 44109"
            maxLength={30}
            className="w-full rounded-md border border-[#D0D7DE] bg-white px-3.5 py-2.5 font-mono text-sm tracking-wider uppercase text-[#193A5A] font-bold shadow-xs focus:border-[#005087] focus:outline-hidden focus:ring-2 focus:ring-[#005087]/20"
          />
        </div>
      </div>

      {/* Question 7: Upload photo or video (optional) */}
      <div className="space-y-3 pt-2">
        <label className="block">
          <div className="flex items-center justify-between">
            <span className="text-sm font-bold text-[#193A5A] flex items-center gap-1.5">
              7. Upload photo or video <span className="text-xs font-normal text-[#767676]">(optional)</span>
            </span>
            <span className="text-xs text-[#767676]">Max size 10MB</span>
          </div>
          <span className="block text-xs text-[#767676] mt-0.5">
            A clear picture of the vehicle, surrounding sidewalk obstruction, or serial number helps resolve the ticket faster.
          </span>
        </label>

        {uploadError && (
          <div className="flex items-center gap-2 text-xs font-semibold text-[#C62828] bg-[#FDE8E8] border border-[#F8B4B4] rounded-md p-3">
            <AlertCircle className="h-4 w-4 shrink-0 text-[#C62828]" />
            <span>{uploadError}</span>
          </div>
        )}

        {/* Existing file attachment preview */}
        {attachment ? (
          <div className="flex items-center justify-between gap-3 p-3.5 rounded-md border border-[#B6D0E2] bg-[#E8F1F6]">
            <div className="flex items-center gap-3 overflow-hidden">
              {attachment.type.startsWith('image/') && attachment.dataUrl ? (
                <img
                  src={attachment.dataUrl}
                  alt="Uploaded photo preview"
                  referrerPolicy="no-referrer"
                  className="h-12 w-12 rounded-sm object-cover border border-[#D0D7DE] shrink-0"
                />
              ) : (
                <div className="flex h-12 w-12 items-center justify-center rounded-sm bg-[#005087] text-white shrink-0">
                  <FileText className="h-6 w-6" />
                </div>
              )}
              <div className="truncate">
                <p className="text-sm font-bold text-[#193A5A] truncate">
                  {attachment.name}
                </p>
                <div className="flex items-center gap-2 text-xs text-[#767676]">
                  <span>{(attachment.size / (1024 * 1024)).toFixed(2)} MB</span>
                  <span aria-hidden="true">·</span>
                  <span className="text-[#008269] font-bold flex items-center gap-0.5">
                    <Check className="h-3 w-3" /> Attached for City Intake
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onChangeAttachment(null)}
              className="p-1.5 rounded-md text-[#767676] hover:text-[#C62828] hover:bg-white transition-colors cursor-pointer"
              title="Remove attached file"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        ) : (
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="flex flex-col items-center justify-center rounded-md border-2 border-dashed border-[#D0D7DE] bg-[#F3F5F7] p-6 text-center hover:border-[#005087] hover:bg-[#E8F1F6]/50 transition-all"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-[#005087] shadow-xs mb-2">
              <Upload className="h-5 w-5" />
            </div>

            <p className="text-sm font-bold text-[#193A5A]">
              Drag and drop photo or video here
            </p>
            <p className="text-xs text-[#767676] mt-0.5">
              Supports JPG, PNG, WEBP, MP4, MOV (up to 10MB)
            </p>

            <div className="mt-4 flex flex-wrap items-center justify-center gap-2.5">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,video/*"
                onChange={(e) => e.target.files?.[0] && handleFileProcess(e.target.files[0])}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-md border border-[#005087] bg-white px-3.5 py-1.5 text-xs font-bold text-[#005087] shadow-xs hover:bg-[#E8F1F6] transition-colors cursor-pointer"
              >
                Choose File
              </button>

              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={(e) => e.target.files?.[0] && handleFileProcess(e.target.files[0])}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => cameraInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 rounded-md border border-[#D0D7DE] bg-white px-3.5 py-1.5 text-xs font-bold text-[#444444] shadow-xs hover:bg-[#F3F5F7] transition-colors cursor-pointer"
              >
                <Camera className="h-3.5 w-3.5 text-[#0081BC]" />
                <span>Take Photo</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
