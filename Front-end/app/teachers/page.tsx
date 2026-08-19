'use client';

import { useState } from "react";
import { ArrowRight, Award, BookOpen, GraduationCap, Search, X } from "lucide-react";
import Navbar from "@/components/Navbar";
import { useLanguage } from "@/components/LanguageProvider";
import { teacherDirectory, type TeacherProfile } from "@/data/teachers";
import { toSinhalaSubject, toSinhalaTeacherName } from "@/utils/localization";

type Teacher = TeacherProfile;

const teachers: Teacher[] = teacherDirectory;

const tabs = [
  { id: "all", label: "All Teachers", sinhalaLabel: "සියලු ගුරුවරු", icon: GraduationCap },
  { id: "ol", label: "O/L", sinhalaLabel: "O/L", icon: BookOpen },
  { id: "al", label: "A/L", sinhalaLabel: "A/L", icon: Award },
  { id: "scholarship", label: "Scholarship & Other", sinhalaLabel: "ශිෂ්‍යත්ව සහ වෙනත්", icon: GraduationCap },
] as const;

export default function TeachersPage() {
  const [active, setActive] = useState<(typeof tabs)[number]["id"]>("all");
  const [query, setQuery] = useState("");
  const [selectedTeacher, setSelectedTeacher] = useState<(typeof teachers)[number] | null>(null);
  const { isSinhala } = useLanguage();

  const filtered = teachers.filter((t) => {
    const matchTab = active === "all" || t.category === active;
    const q = query.trim().toLowerCase();
    const searchable = [
      t.name,
      t.subject,
      t.credentials,
      t.experience,
      t.about,
      t.medium,
      t.schedule,
      t.qualifications,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    const matchQuery = !q || searchable.includes(q);
    return matchTab && matchQuery;
  });

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-[#eef2f7]">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden pt-24 pb-12">
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-blue-50 via-white to-orange-50" />
        <div className="absolute -top-24 -right-24 -z-10 h-72 w-72 rounded-full bg-gradient-to-br from-[#D9232D]/10 to-[#F47920]/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 -z-10 h-72 w-72 rounded-full bg-blue-200/30 blur-3xl" />

        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <span className="mb-3 inline-block rounded-full bg-blue-100 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-blue-600">
            {isSinhala ? "අපගේ ගුරු මණ්ඩලය" : "Meet Our Educators"}
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl md:text-6xl">
            {isSinhala ? "අපගේ" : "Our"}{" "}
            <span className="bg-gradient-to-r from-[#D9232D] to-[#F47920] bg-clip-text text-transparent">
              {isSinhala ? "ගුරුවරු" : "Teachers"}
            </span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-gray-600 sm:text-lg">
            {isSinhala
              ? "O/L, A/L සහ ශිෂ්‍යත්ව සිසුන්ට විශිෂ්ටත්වය කරා මඟ පෙන්වන පළපුරුදු විෂය විශේෂඥයින්."
              : "Experienced subject specialists guiding O/L, A/L and Scholarship students towards excellence."}
          </p>

          <div className="mx-auto mt-8 flex max-w-md items-center gap-2 rounded-full border border-blue-100 bg-white/80 px-4 py-2 shadow-sm backdrop-blur">
            <Search className="h-4 w-4 text-blue-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={isSinhala ? "නම හෝ විෂය අනුව සොයන්න..." : "Search by name or subject..."}
              className="flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 outline-none"
            />
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {tabs.map((t) => {
            const Icon = t.icon;
            const isActive = active === t.id;
            return (
              <button
                key={t.id}
                onClick={() => setActive(t.id)}
                className={`group inline-flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-all duration-300 ${
                  isActive
                    ? "bg-gradient-to-r from-[#D9232D] to-[#F47920] text-white shadow-lg shadow-orange-400/30"
                    : "border border-blue-100 bg-white text-blue-700 hover:border-blue-300 hover:shadow-md"
                }`}
              >
                <Icon className="h-4 w-4" />
                {isSinhala ? t.sinhalaLabel : t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Grid */}
      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {filtered.length === 0 ? (
          <div className="py-20 text-center text-gray-500">{isSinhala ? "ගුරුවරු හමු නොවීය." : "No teachers found."}</div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((t) => (
              <article
                key={t.id}
                className="group relative overflow-hidden rounded-3xl bg-white shadow-sm ring-1 ring-black/5 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div
                  className="relative flex h-56 items-end justify-center overflow-hidden"
                  style={{ backgroundColor: t.photoBg }}
                >
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/10" />
                  {t.photo ? (
                    <img
                      src={t.photo}
                      alt={toSinhalaTeacherName(t.name, isSinhala)}
                      className="absolute inset-0 h-full w-full object-cover object-top"
                    />
                  ) : (
                    <div
                      className="relative mb-4 flex h-32 w-32 items-center justify-center rounded-full bg-white/90 text-3xl font-black shadow-lg ring-4 ring-white"
                      style={{ color: t.accent }}
                    >
                      {t.initials}
                    </div>
                  )}
                  <span
                    className="absolute right-3 top-3 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow"
                    style={{ backgroundColor: t.accent }}
                  >
                    {t.category === "ol" ? "O/L" : t.category === "al" ? "A/L" : "Scholarship"}
                  </span>
                </div>

                <div className="p-5">
                  <h3 className="text-lg font-bold text-gray-900">{toSinhalaTeacherName(t.name, isSinhala)}</h3>
                  <p className="mt-0.5 text-sm font-semibold" style={{ color: t.accent }}>
                    {toSinhalaSubject(t.subject, isSinhala)}
                  </p>
                  <p className="mt-2 line-clamp-2 text-xs text-gray-600">{toSinhalaSubject(t.credentials, isSinhala)}</p>

                  <div className="mt-4 flex items-center justify-between border-t border-gray-100 pt-3">
                    <span className="text-xs font-medium text-gray-500">{toSinhalaSubject(t.experience, isSinhala)}</span>
                    <button
                      type="button"
                      onClick={() => setSelectedTeacher(t)}
                      className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 transition-colors hover:text-blue-900"
                    >
                      {isSinhala ? "විස්තර බලන්න" : "View Profile"}
                      <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

        {selectedTeacher ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 px-4 py-6 backdrop-blur-sm">
          <div className="relative w-full max-w-lg md:max-w-3xl max-h-[90vh] overflow-auto rounded-3xl bg-white shadow-2xl">
            <button
              type="button"
              onClick={() => setSelectedTeacher(null)}
              className="absolute right-4 top-4 rounded-full bg-white/90 p-2 text-slate-600 shadow-sm transition hover:bg-slate-100 hover:text-slate-900"
              aria-label="Close profile"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex flex-col gap-6 p-4 md:flex-row md:items-start md:p-8">
              <div
                className="relative mx-auto h-40 w-40 sm:h-48 sm:w-48 flex-shrink-0 overflow-hidden rounded-3xl shadow-lg md:mx-0 md:h-56 md:w-56"
                style={{ backgroundColor: selectedTeacher.photoBg }}
              >
                {selectedTeacher.photo ? (
                  <img
                    src={selectedTeacher.photo}
                    alt={toSinhalaTeacherName(selectedTeacher.name, isSinhala)}
                    className="h-full w-full object-cover object-top"
                  />
                ) : (
                  <div
                    className="flex h-full w-full items-center justify-center text-5xl font-black text-white"
                    style={{ color: selectedTeacher.accent }}
                  >
                    {selectedTeacher.initials}
                  </div>
                )}
              </div>

              <div className="min-w-0 flex-1 md:pt-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wider text-white"
                    style={{ backgroundColor: selectedTeacher.accent }}
                  >
                    {selectedTeacher.category === "ol" ? "O/L" : selectedTeacher.category === "al" ? "A/L" : "Scholarship"}
                  </span>
                  <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    {toSinhalaSubject(selectedTeacher.experience, isSinhala)}
                  </span>
                </div>

                <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{isSinhala ? "ගුරු පැතිකඩ" : "Tutor Profile"}</p>
                <h3 className="mt-1 text-2xl md:text-3xl font-extrabold text-slate-900">{toSinhalaTeacherName(selectedTeacher.name, isSinhala)}</h3>
                <h2 className="mt-3 text-xl md:mt-4 md:text-2xl font-extrabold text-slate-900">{toSinhalaSubject(selectedTeacher.subject, isSinhala)}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {isSinhala
                    ? `${toSinhalaTeacherName(selectedTeacher.name, true)} විසින් ${toSinhalaSubject(selectedTeacher.subject, true)} සඳහා සැලසුම්ගත මඟපෙන්වීම ලබා දෙයි.`
                    : selectedTeacher.about}
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{isSinhala ? "සුදුසුකම්" : "Qualifications"}</p>
                    <p className="mt-1 whitespace-pre-line text-sm font-medium text-slate-800">{toSinhalaSubject(selectedTeacher.qualifications ?? selectedTeacher.credentials, isSinhala)}</p>
                  </div>
                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{isSinhala ? "විෂය" : "Subject"}</p>
                    <p className="mt-1 text-sm font-medium text-slate-800">{toSinhalaSubject(selectedTeacher.subject, isSinhala)}</p>
                  </div>
                  {selectedTeacher.medium ? (
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Medium</p>
                      <p className="mt-1 text-sm font-medium text-slate-800">{selectedTeacher.medium}</p>
                    </div>
                  ) : null}
                  {selectedTeacher.whatsapp || selectedTeacher.email ? (
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Contact</p>
                      {selectedTeacher.whatsapp ? <p className="mt-1 text-sm font-medium text-slate-800">WhatsApp: {selectedTeacher.whatsapp}</p> : null}
                      {selectedTeacher.email ? <p className="mt-1 break-words text-sm font-medium text-slate-800">Email: {selectedTeacher.email}</p> : null}
                    </div>
                  ) : null}
                </div>

                {selectedTeacher.schedule ? (
                  <div className="mt-3 rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Classes</p>
                    <p className="mt-1 whitespace-pre-line text-sm leading-6 text-slate-700">{toSinhalaSubject(selectedTeacher.schedule, isSinhala)}</p>
                  </div>
                ) : null}

                <div className="mt-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{isSinhala ? "ඉගැන්වීමේ අවධානය" : "Teaching Focus"}</p>
                  <p className="mt-1 text-sm leading-6 text-slate-700">
                    {isSinhala
                      ? `${toSinhalaTeacherName(selectedTeacher.name, true)} සිසුන්ට මූලික දැනුම ශක්තිමත් කර ගැනීමට සහ විභාග සඳහා සාර්ථකව සූදානම් වීමට උපකාර කරයි.`
                      : `${selectedTeacher.name} helps students strengthen fundamentals, improve problem solving, and prepare effectively for exams.`}
                  </p>
                </div>

                <div className="mt-6 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setSelectedTeacher(null)}
                    className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700"
                  >
                    {isSinhala ? "වසන්න" : "Close Profile"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-blue-700 to-blue-900 p-8 text-center shadow-xl sm:p-12">
          <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-orange-300/20 blur-2xl" />
          <h2 className="text-2xl font-extrabold text-white sm:text-3xl">
            {isSinhala ? "හොඳම ගුරුවරුන් සමඟ ඉගෙනීමට සූදානම්ද?" : "Ready to learn from the best?"}
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm text-blue-100">
            {isSinhala ? "අපගේ විශේෂඥ ගුරුවරුන් සමඟ විශිෂ්ට ප්‍රතිඵල ලබාගන්නා සිසුන් අතරට එක්වන්න." : "Join hundreds of students achieving outstanding results with our expert educators."}
          </p>
          <button className="mt-6 rounded-full bg-gradient-to-r from-[#D9232D] to-[#F47920] px-8 py-3 text-sm font-bold text-white shadow-lg shadow-orange-400/40 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl active:scale-95">
            {isSinhala ? "දැන් ලියාපදිංචි වන්න" : "Enroll Now"}
          </button>
        </div>
      </section>
    </div>
  );
}
