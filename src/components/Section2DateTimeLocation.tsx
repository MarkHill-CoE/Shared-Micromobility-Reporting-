import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  Navigation,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Sparkles,
} from 'lucide-react';

interface Section2Props {
  incidentDate: string;
  onChangeIncidentDate: (date: string) => void;
  incidentTime: string;
  onChangeIncidentTime: (time: string) => void;
  locationDetails: string;
  onChangeLocationDetails: (loc: string) => void;
  gpsCoordinates?: {
    latitude: number;
    longitude: number;
    accuracy?: number;
  };
  onSetGpsCoordinates: (coords: { latitude: number; longitude: number; accuracy?: number } | undefined) => void;
  errors: {
    incidentDate?: string;
    incidentTime?: string;
    locationDetails?: string;
  };
}

export const Section2DateTimeLocation: React.FC<Section2Props> = ({
  incidentDate,
  onChangeIncidentDate,
  incidentTime,
  onChangeIncidentTime,
  locationDetails,
  onChangeLocationDetails,
  gpsCoordinates,
  onSetGpsCoordinates,
  errors,
}) => {
  const [isLocating, setIsLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);

  const setNow = () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    onChangeIncidentDate(`${yyyy}-${mm}-${dd}`);

    const hh = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    onChangeIncidentTime(`${hh}:${min}`);
  };

  const handleDetectLocation = () => {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser or device.');
      return;
    }

    setIsLocating(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setIsLocating(false);
        const lat = parseFloat(position.coords.latitude.toFixed(5));
        const lng = parseFloat(position.coords.longitude.toFixed(5));
        const accuracy = Math.round(position.coords.accuracy);

        onSetGpsCoordinates({
          latitude: lat,
          longitude: lng,
          accuracy,
        });

        if (!locationDetails.trim()) {
          onChangeLocationDetails(`GPS (${lat}, ${lng}) - Near `);
        }
      },
      (err) => {
        setIsLocating(false);
        if (err.code === err.PERMISSION_DENIED) {
          setGeoError('Location access was denied. Please type the street or intersection manually.');
        } else {
          setGeoError('Unable to retrieve device position. Please type the location manually.');
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  return (
    <section aria-labelledby="section-2-heading" className="space-y-7">
      <div className="border-b border-[#D0D7DE] pb-3">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#005087]">
          <span>Section 2 of 3</span>
        </div>
        <h2 id="section-2-heading" className="text-xl font-bold text-[#193A5A] mt-1">
          Incident Date and Location Details
        </h2>
        <p className="text-xs text-[#767676] mt-0.5">
          Tell us when and where the incident occurred so City operations or the licensed vendor can locate the equipment.
        </p>
      </div>

      {/* Question 3: Date and time of incident */}
      <fieldset className="space-y-3">
        <legend className="block w-full">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <span className="text-sm font-bold text-[#193A5A] flex items-center gap-1.5">
              3. Date and time of incident <span className="text-[#C62828]" aria-hidden="true">*</span>
            </span>
            <button
              type="button"
              onClick={setNow}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#005087] hover:text-[#193A5A] hover:underline transition-colors self-start sm:self-auto cursor-pointer"
            >
              <Sparkles className="h-3 w-3 text-[#0081BC]" />
              <span>Set to current date &amp; time</span>
            </button>
          </div>
          <span className="block text-xs text-[#767676] mt-0.5">
            Approximate time when you observed or encountered the issue.
          </span>
        </legend>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          {/* Date Picker */}
          <div>
            <label htmlFor="incident-date" className="block text-xs font-semibold text-[#444444] mb-1">
              Date (Month, Day, Year) <span className="text-[#C62828]">*</span>
            </label>
            <div className="relative">
              <input
                id="incident-date"
                type="date"
                value={incidentDate}
                onChange={(e) => onChangeIncidentDate(e.target.value)}
                max={new Date().toISOString().slice(0, 10)}
                className={`w-full rounded-md border bg-white px-3.5 py-2.5 text-sm text-[#222222] shadow-xs focus:outline-hidden focus:ring-2 ${
                  errors.incidentDate
                    ? 'border-[#C62828] focus:border-[#C62828] focus:ring-[#C62828]/20'
                    : 'border-[#D0D7DE] focus:border-[#005087] focus:ring-[#005087]/20'
                }`}
              />
              <Calendar className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-[#767676]" />
            </div>
            {errors.incidentDate && (
              <p className="mt-1.5 text-xs text-[#C62828] font-semibold flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                <span>{errors.incidentDate}</span>
              </p>
            )}
          </div>

          {/* Time Picker */}
          <div>
            <label htmlFor="incident-time" className="block text-xs font-semibold text-[#444444] mb-1">
              Time (Hours : Minutes)
            </label>
            <div className="relative">
              <input
                id="incident-time"
                type="time"
                value={incidentTime}
                onChange={(e) => onChangeIncidentTime(e.target.value)}
                className={`w-full rounded-md border bg-white px-3.5 py-2.5 text-sm text-[#222222] shadow-xs focus:outline-hidden focus:ring-2 ${
                  errors.incidentTime
                    ? 'border-[#C62828] focus:border-[#C62828] focus:ring-[#C62828]/20'
                    : 'border-[#D0D7DE] focus:border-[#005087] focus:ring-[#005087]/20'
                }`}
              />
              <Clock className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-[#767676]" />
            </div>
            {errors.incidentTime && (
              <p className="mt-1.5 text-xs text-[#C62828] font-semibold flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                <span>{errors.incidentTime}</span>
              </p>
            )}
          </div>
        </div>
      </fieldset>

      {/* Question 4: Location details */}
      <div className="space-y-3 pt-2">
        <label htmlFor="location-details" className="block">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <span className="text-sm font-bold text-[#193A5A] flex items-center gap-1.5">
              4. Location details <span className="text-[#C62828]" aria-hidden="true">*</span>
            </span>
            <button
              type="button"
              onClick={handleDetectLocation}
              disabled={isLocating}
              className="inline-flex items-center gap-1.5 rounded-md border border-[#005087] bg-white px-3 py-1 text-xs font-bold text-[#005087] hover:bg-[#E8F1F6] transition-colors shadow-xs disabled:opacity-50 self-start sm:self-auto cursor-pointer"
            >
              {isLocating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin text-[#005087]" />
              ) : (
                <Navigation className="h-3.5 w-3.5 text-[#005087]" />
              )}
              <span>{isLocating ? 'Detecting GPS...' : 'Use my current location'}</span>
            </button>
          </div>
          <span className="block text-xs text-[#767676] mt-0.5">
            Please note the precise location of the issue (e.g., street name, intersection).
          </span>
        </label>

        {errors.locationDetails && (
          <div className="flex items-center gap-2 text-xs font-semibold text-[#C62828] bg-[#FDE8E8] border border-[#F8B4B4] rounded-md p-3">
            <AlertCircle className="h-4 w-4 shrink-0 text-[#C62828]" />
            <span>{errors.locationDetails}</span>
          </div>
        )}

        {geoError && (
          <div className="flex items-center gap-2 text-xs font-medium text-[#92400E] bg-[#FEF3C7] border border-[#FDE68A] rounded-md p-3">
            <AlertCircle className="h-4 w-4 shrink-0 text-[#D97706]" />
            <span>{geoError}</span>
          </div>
        )}

        {gpsCoordinates && (
          <div className="flex items-center justify-between text-xs text-[#005087] bg-[#E8F1F6] border border-[#B6D0E2] rounded-md px-3.5 py-2">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[#008269] shrink-0" />
              <span>
                GPS Attached: <span className="font-mono tabular-nums font-bold text-[#193A5A]">{gpsCoordinates.latitude}, {gpsCoordinates.longitude}</span>
                {gpsCoordinates.accuracy && <span className="text-[#444444]"> (±{gpsCoordinates.accuracy}m accuracy)</span>}
              </span>
            </div>
            <button
              type="button"
              onClick={() => onSetGpsCoordinates(undefined)}
              className="text-[#767676] hover:text-[#C62828] text-xs font-medium underline ml-2"
            >
              Clear
            </button>
          </div>
        )}

        <div className="relative">
          <input
            id="location-details"
            type="text"
            value={locationDetails}
            onChange={(e) => onChangeLocationDetails(e.target.value)}
            placeholder="e.g. 104 Street NW & Jasper Avenue, outside City Centre entrance"
            maxLength={250}
            className={`w-full rounded-md border bg-white pl-10 pr-3.5 py-2.5 text-sm text-[#222222] shadow-xs focus:outline-hidden focus:ring-2 ${
              errors.locationDetails
                ? 'border-[#C62828] focus:border-[#C62828] focus:ring-[#C62828]/20'
                : 'border-[#D0D7DE] focus:border-[#005087] focus:ring-[#005087]/20'
            }`}
          />
          <MapPin className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-[#767676]" />
        </div>
      </div>
    </section>
  );
};
