import React, { useEffect, useMemo, useState } from "react";
import { SchoolCatalogItem } from "../types";

interface SchoolAutocompleteProps {
  label: string;
  catalog: SchoolCatalogItem[];
  selectedSchoolId: string;
  onSelectedSchoolIdChange: (value: string) => void;
  otherSchoolName: string;
  onOtherSchoolNameChange: (value: string) => void;
  otherLocation: string;
  onOtherLocationChange: (value: string) => void;
  otherCity: string;
  onOtherCityChange: (value: string) => void;
  cityRequired?: boolean;
}

export const SchoolAutocomplete: React.FC<SchoolAutocompleteProps> = ({
  label,
  catalog,
  selectedSchoolId,
  onSelectedSchoolIdChange,
  otherSchoolName,
  onOtherSchoolNameChange,
  otherLocation,
  onOtherLocationChange,
  otherCity,
  onOtherCityChange,
  cityRequired = true,
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const selectedSchool = catalog.find((item) => item.id === selectedSchoolId);
  const [query, setQuery] = useState(selectedSchool?.schoolName || otherSchoolName || "");

  useEffect(() => {
    setQuery(selectedSchool?.schoolName || otherSchoolName || "");
  }, [selectedSchool?.schoolName, otherSchoolName]);

  const normalizedQuery = query.trim().toLowerCase();
  const filteredSchools = useMemo(() => {
    if (!normalizedQuery) {
      return catalog.slice(0, 8);
    }

    return catalog.filter((item) => {
      const haystack = [item.schoolName, item.location || "", item.city || ""].join(" ").toLowerCase();
      return haystack.includes(normalizedQuery);
    }).slice(0, 8);
  }, [catalog, normalizedQuery]);

  const showSuggestions = isFocused && filteredSchools.length > 0;
  const isManualEntry = !selectedSchool && query.trim().length > 0;

  const handleInputChange = (value: string) => {
    setQuery(value);
    onSelectedSchoolIdChange("");
    onOtherSchoolNameChange(value);
    if (!value.trim()) {
      onOtherLocationChange("");
      onOtherCityChange("");
    }
  };

  const handleSelectSchool = (school: SchoolCatalogItem) => {
    setQuery(school.schoolName);
    onSelectedSchoolIdChange(school.id);
    onOtherSchoolNameChange("");
    onOtherLocationChange("");
    onOtherCityChange("");
    setIsFocused(false);
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">{label}</label>
        <input
          type="text"
          value={query}
          onFocus={() => setIsFocused(true)}
          onBlur={() => {
            window.setTimeout(() => setIsFocused(false), 120);
          }}
          onChange={(e) => handleInputChange(e.target.value)}
          placeholder="Type school name, location, or city"
          className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm"
          required
        />

        {showSuggestions && (
          <div className="absolute z-20 mt-2 max-h-64 w-full overflow-y-auto rounded-2xl border border-gray-200 bg-white shadow-xl">
            {filteredSchools.map((item) => (
              <button
                key={item.id}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelectSchool(item)}
                className="w-full border-b border-gray-100 px-4 py-3 text-left hover:bg-slate-50 last:border-b-0"
              >
                <div className="text-sm font-semibold text-slate-800">{item.schoolName}</div>
                <div className="text-[11px] text-slate-500">
                  {[item.location, item.city].filter(Boolean).join(", ")}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {selectedSchool && (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 px-4 py-3 text-[11px] text-emerald-800">
          Selected school: <strong>{selectedSchool.schoolName}</strong>
          {selectedSchool.location ? `, ${selectedSchool.location}` : ""}
          {selectedSchool.city ? `, ${selectedSchool.city}` : ""}.
        </div>
      )}

      {isManualEntry && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">Location</label>
            <input
              type="text"
              placeholder="e.g. Nerul"
              value={otherLocation}
              onChange={(e) => onOtherLocationChange(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-600 uppercase tracking-wider mb-2">City</label>
            <input
              type="text"
              placeholder="e.g. Navi Mumbai"
              value={otherCity}
              onChange={(e) => onOtherCityChange(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm"
              required={cityRequired}
            />
          </div>
        </div>
      )}
    </div>
  );
};
