import { useEffect, useMemo, useState } from "react";
import { Link, NavLink, Route, Routes, useNavigate, useParams } from "react-router-dom";
import { courses, initialStudents, statuses, years } from "./data.js";

const STORAGE_KEY = "campusflow_students_v1";
const SETTINGS_KEY = "campusflow_settings_v1";

function readStudents() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : initialStudents;
  } catch {
    return initialStudents;
  }
}

function readSettings() {
  try {
    return JSON.parse(localStorage.getItem(SETTINGS_KEY)) || { compactTable: false };
  } catch {
    return { compactTable: false };
  }
}

function initials(name = "") {
  return name.trim().split(/\s+/).slice(0, 2).map((part) => part[0] || "").join("").toUpperCase();
}

function formatDate(value) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${value}T00:00:00`));
}

function Avatar({ name, size = "" }) {
  return <span className={`avatar ${size}`}>{initials(name)}</span>;
}

function StatusBadge({ status }) {
  return <span className={`badge badge-${status.toLowerCase()}`}><span className="badge-dot" />{status}</span>;
}

function ProgressBar({ value }) {
  return (
    <div className="progress-wrap">
      <div className="progress-track"><span style={{ width: `${value}%` }} /></div>
      <span className="progress-value">{value}%</span>
    </div>
  );
}

function EmptyState({ title = "No students found", description = "Try changing your search or filters." }) {
  return <div className="empty-state"><div className="empty-icon">⌕</div><h3>{title}</h3><p>{description}</p></div>;
}

function StudentForm({ initialValue, onSubmit, onCancel }) {
  const [form, setForm] = useState(initialValue || {
    name: "", email: "", course: courses[0], year: years[0], status: "Active", progress: 0, joined: new Date().toISOString().slice(0, 10)
  });
  const [errors, setErrors] = useState({});

  function updateField(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: name === "progress" ? Number(value) : value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  }

  function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = "Please enter the student's name.";
    if (!form.email.trim()) nextErrors.email = "Please enter an email address.";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) nextErrors.email = "Enter a valid email address.";
    if (!form.joined) nextErrors.joined = "Please choose a join date.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length === 0) {
      onSubmit({ ...form, name: form.name.trim(), email: form.email.trim().toLowerCase() });
    }
  }

  return (
    <form className="student-form" onSubmit={handleSubmit} noValidate>
      <div className="form-grid">
        <label className="field"><span>Full name <b>*</b></span><input name="name" value={form.name} onChange={updateField} placeholder="e.g. Priya Shah" autoFocus />{errors.name && <small className="field-error">{errors.name}</small>}</label>
        <label className="field"><span>Email address <b>*</b></span><input name="email" type="email" value={form.email} onChange={updateField} placeholder="student@example.com" />{errors.email && <small className="field-error">{errors.email}</small>}</label>
        <label className="field"><span>Course</span><select name="course" value={form.course} onChange={updateField}>{courses.map((course) => <option key={course}>{course}</option>)}</select></label>
        <label className="field"><span>Academic year</span><select name="year" value={form.year} onChange={updateField}>{years.map((year) => <option key={year}>{year}</option>)}</select></label>
        <label className="field"><span>Status</span><select name="status" value={form.status} onChange={updateField}>{statuses.map((status) => <option key={status}>{status}</option>)}</select></label>
        <label className="field"><span>Join date <b>*</b></span><input name="joined" type="date" value={form.joined} onChange={updateField} />{errors.joined && <small className="field-error">{errors.joined}</small>}</label>
        <label className="field field-full"><span>Course progress <strong>{form.progress}%</strong></span><input className="range-input" name="progress" type="range" min="0" max="100" value={form.progress} onChange={updateField} /><span className="range-labels"><small>Just started</small><small>Completed</small></span></label>
      </div>
      <div className="form-actions"><button type="button" className="button button-secondary" onClick={onCancel}>Cancel</button><button type="submit" className="button button-primary">{initialValue ? "Save changes" : "Add student"}</button></div>
    </form>
  );
}

function Modal({ title, subtitle, onClose, children }) {
  useEffect(() => {
    function onKeyDown(event) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className="modal-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="modal" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-heading"><div><h2>{title}</h2><p>{subtitle}</p></div><button className="icon-button close-button" onClick={onClose} aria-label="Close dialog">×</button></div>
        {children}
      </section>
    </div>
  );
}

function Sidebar({ onAdd }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const navItems = [
    { to: "/", label: "Overview", icon: "▦", end: true },
    { to: "/students", label: "Students", icon: "♙" },
    { to: "/courses", label: "Courses", icon: "▤" },
    { to: "/settings", label: "Settings", icon: "⚙" }
  ];

  return (
    <>
      <button className="mobile-menu-button" onClick={() => setMobileOpen((open) => !open)} aria-label="Toggle navigation">☰</button>
      {mobileOpen && <button className="mobile-scrim" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />}
      <aside className={`sidebar ${mobileOpen ? "sidebar-open" : ""}`}>
        <Link className="brand" to="/" onClick={() => setMobileOpen(false)}><span className="brand-mark">C</span><span>campus<span className="brand-light">flow</span><small>STUDENT PORTAL</small></span></Link>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="side-nav">
          {navItems.map((item) => <NavLink key={item.to} to={item.to} end={item.end} onClick={() => setMobileOpen(false)} className={({ isActive }) => `nav-link ${isActive ? "nav-link-active" : ""}`}><span className="nav-icon">{item.icon}</span>{item.label}{item.label === "Students" && <span className="nav-arrow">›</span>}</NavLink>)}
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card"><span className="help-icon">✦</span><strong>Keep learning</strong><p>Small steps lead to big progress.</p><div className="help-line"><span /></div><small>You're doing great!</small></div>
          <div className="sidebar-profile"><Avatar name="Alex Morgan" /><div><strong>Alex Morgan</strong><small>Administrator</small></div><span className="profile-dots">•••</span></div>
        </div>
      </aside>
    </>
  );
}

function Topbar({ title, eyebrow, onAdd }) {
  return (
    <header className="topbar">
      <div className="topbar-title"><span>{eyebrow}</span><h1>{title}</h1></div>
      <div className="topbar-actions"><div className="today-pill"><span>◷</span> {new Intl.DateTimeFormat("en", { weekday: "short", month: "short", day: "numeric" }).format(new Date())}</div><button className="button button-primary top-add" onClick={onAdd}><span>＋</span> Add student</button><Avatar name="Alex Morgan" /></div>
    </header>
  );
}

function Dashboard({ students, onAdd, onViewAll }) {
  const activeCount = students.filter((student) => student.status === "Active").length;
  const avgProgress = students.length ? Math.round(students.reduce((sum, student) => sum + Number(student.progress || 0), 0) / students.length) : 0;
  const courseCount = new Set(students.map((student) => student.course)).size;
  const recent = [...students].sort((a, b) => b.joined.localeCompare(a.joined)).slice(0, 5);
  const courseStats = courses.map((course) => ({ course, count: students.filter((student) => student.course === course).length })).filter((item) => item.count > 0).sort((a, b) => b.count - a.count);
  const maxCourse = Math.max(1, ...courseStats.map((item) => item.count));

  return (
    <>
      <div className="welcome-banner"><div><span className="banner-tag">YOUR CAMPUS AT A GLANCE</span><h2>Learning starts with a<br /><em>great community.</em></h2><p>Here's what's happening across your student community.</p><button className="button button-light" onClick={onAdd}>＋ Register a student</button></div><div className="banner-art" aria-hidden="true"><div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" /><div className="art-book">▤</div><div className="art-cap">◆</div><div className="art-spark spark-one">✦</div><div className="art-spark spark-two">✧</div></div></div>
      <section className="stats-grid">
        <StatCard label="Total students" value={students.length} note="Across all courses" icon="♙" tone="purple" />
        <StatCard label="Active students" value={activeCount} note={`${students.length ? Math.round(activeCount / students.length * 100) : 0}% of all students`} icon="✓" tone="green" />
        <StatCard label="Courses running" value={courseCount} note="With enrolled students" icon="▤" tone="orange" />
        <StatCard label="Average progress" value={`${avgProgress}%`} note="Across all students" icon="↗" tone="blue" />
      </section>
      <div className="dashboard-columns">
        <section className="panel recent-panel">
          <div className="panel-heading"><div><h2>Recently joined</h2><p>Your newest student registrations</p></div><button className="text-button" onClick={onViewAll}>View all <span>→</span></button></div>
          {recent.length ? <div className="table-scroll"><table><thead><tr><th>STUDENT</th><th>COURSE</th><th>STATUS</th><th>JOINED</th></tr></thead><tbody>{recent.map((student) => <tr key={student.id}><td><Link className="student-cell" to={`/students/${student.id}`}><Avatar name={student.name} /><span><strong>{student.name}</strong><small>{student.email}</small></span></Link></td><td><span className="course-cell">{student.course}</span></td><td><StatusBadge status={student.status} /></td><td className="date-cell">{formatDate(student.joined)}</td></tr>)}</tbody></table></div> : <EmptyState title="No students yet" description="Add your first student to see them here." />}
        </section>
        <section className="panel course-panel">
          <div className="panel-heading"><div><h2>Course distribution</h2><p>Students by course</p></div><span className="heading-icon">▥</span></div>
          {courseStats.length ? <div className="course-stats">{courseStats.map((item, index) => <div className="course-stat" key={item.course}><div className="course-stat-top"><span className={`course-dot dot-${index % 4}`} /> <span className="course-name">{item.course}</span><strong>{item.count}</strong></div><div className="course-bar"><span className={`bar-${index % 4}`} style={{ width: `${item.count / maxCourse * 100}%` }} /></div></div>)}</div> : <EmptyState title="No course data" description="Add students to see course distribution." />}
          <div className="course-panel-footer"><span className="footer-mini-icon">✦</span><span><strong>Every learner counts.</strong><small>Keep your student records up to date.</small></span></div>
        </section>
      </div>
      <div className="bottom-note"><span>✦</span> A great learning community starts with one student at a time.</div>
    </>
  );
}

function StatCard({ label, value, note, icon, tone }) {
  return <article className="stat-card"><div className={`stat-icon stat-${tone}`}>{icon}</div><span className="stat-label">{label}</span><strong className="stat-value">{value}</strong><span className="stat-note">{note}</span></article>;
}

function StudentsPage({ students, onAdd, onEdit, onDelete, compactTable }) {
  const [search, setSearch] = useState("");
  const [courseFilter, setCourseFilter] = useState("All courses");
  const [statusFilter, setStatusFilter] = useState("All statuses");
  const [sortBy, setSortBy] = useState("name");
  const [deleteTarget, setDeleteTarget] = useState(null);

  const filtered = useMemo(() => students.filter((student) => {
    const term = search.toLowerCase().trim();
    const matchesSearch = !term || [student.name, student.email, student.course].some((value) => value.toLowerCase().includes(term));
    return matchesSearch && (courseFilter === "All courses" || student.course === courseFilter) && (statusFilter === "All statuses" || student.status === statusFilter);
  }).sort((a, b) => String(a[sortBy] ?? "").localeCompare(String(b[sortBy] ?? ""))), [students, search, courseFilter, statusFilter, sortBy]);

  return (
    <>
      <div className="page-intro"><div><h2>All students</h2><p>Manage your student records, track progress, and keep everything organised.</p></div><button className="button button-primary" onClick={onAdd}>＋ Add student</button></div>
      <section className="panel student-list-panel">
        <div className="list-toolbar"><div className="search-box"><span>⌕</span><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search students, email, course..." aria-label="Search students" />{search && <button onClick={() => setSearch("")} aria-label="Clear search">×</button>}</div><div className="filter-controls"><select value={courseFilter} onChange={(event) => setCourseFilter(event.target.value)} aria-label="Filter by course"><option>All courses</option>{courses.map((course) => <option key={course}>{course}</option>)}</select><select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filter by status"><option>All statuses</option>{statuses.map((status) => <option key={status}>{status}</option>)}</select><select value={sortBy} onChange={(event) => setSortBy(event.target.value)} aria-label="Sort students"><option value="name">Sort: Name</option><option value="course">Sort: Course</option><option value="status">Sort: Status</option><option value="joined">Sort: Join date</option></select></div></div>
        <div className="table-meta"><span>Showing <strong>{filtered.length}</strong> of <strong>{students.length}</strong> students</span><span className="meta-live"><span /> Live data</span></div>
        {filtered.length ? <div className="table-scroll"><table className={compactTable ? "compact-table" : ""}><thead><tr><th>STUDENT</th><th>COURSE & YEAR</th><th>PROGRESS</th><th>STATUS</th><th>JOINED</th><th className="actions-heading">ACTIONS</th></tr></thead><tbody>{filtered.map((student) => <tr key={student.id}><td><Link className="student-cell" to={`/students/${student.id}`}><Avatar name={student.name} /><span><strong>{student.name}</strong><small>{student.email}</small></span></Link></td><td><span className="course-cell">{student.course}</span><small className="table-subtext">{student.year}</small></td><td><ProgressBar value={student.progress} /></td><td><StatusBadge status={student.status} /></td><td className="date-cell">{formatDate(student.joined)}</td><td><div className="row-actions"><Link className="row-action" to={`/students/${student.id}`} title="View details" aria-label={`View ${student.name}`}>↗</Link><button className="row-action" onClick={() => onEdit(student)} title="Edit student" aria-label={`Edit ${student.name}`}>✎</button><button className="row-action row-action-delete" onClick={() => setDeleteTarget(student)} title="Delete student" aria-label={`Delete ${student.name}`}>⌫</button></div></td></tr>)}</tbody></table></div> : <EmptyState title="No matching students" description="Try another search term or reset your filters." />}
      </section>
      {deleteTarget && <Modal title="Delete student?" subtitle="This action cannot be undone." onClose={() => setDeleteTarget(null)}><div className="delete-confirm"><Avatar name={deleteTarget.name} size="avatar-large" /><p>Are you sure you want to delete <strong>{deleteTarget.name}</strong> from your student records?</p><div className="form-actions"><button className="button button-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button><button className="button button-danger" onClick={() => { onDelete(deleteTarget.id); setDeleteTarget(null); }}>Delete student</button></div></div></Modal>}
    </>
  );
}

function StudentDetails({ students, onEdit, onDelete }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const student = students.find((item) => String(item.id) === id);
  if (!student) return <section className="panel not-found"><div className="empty-icon">?</div><h2>Student not found</h2><p>This student may have been removed or the link is incorrect.</p><Link className="button button-primary" to="/students">Back to students</Link></section>;

  return (
    <>
      <div className="back-row"><button className="text-button" onClick={() => navigate(-1)}>← Back</button><span>/</span><span>Student details</span></div>
      <section className="panel detail-hero"><div className="detail-person"><Avatar name={student.name} size="avatar-xl" /><div><div className="detail-name-row"><h2>{student.name}</h2><StatusBadge status={student.status} /></div><p>{student.email}</p><small>Student ID: #{student.id}</small></div></div><div className="detail-actions"><button className="button button-secondary" onClick={() => onEdit(student)}>✎ Edit student</button><button className="button button-primary" onClick={() => navigate("/students")}>All students</button></div></section>
      <div className="detail-grid"><section className="panel detail-card"><div className="panel-heading"><div><h2>Student information</h2><p>Personal enrolment details</p></div></div><InfoRow label="Full name" value={student.name} /><InfoRow label="Email address" value={student.email} /><InfoRow label="Course" value={student.course} /><InfoRow label="Academic year" value={student.year} /><InfoRow label="Join date" value={formatDate(student.joined)} /><InfoRow label="Student ID" value={`#${student.id}`} /></section><section className="panel detail-card progress-detail"><div className="panel-heading"><div><h2>Learning progress</h2><p>Current course completion</p></div></div><div className="big-progress"><strong>{student.progress}%</strong><span>completed</span></div><div className="progress-track progress-track-large"><span style={{ width: `${student.progress}%` }} /></div><p className="progress-description">{student.progress >= 80 ? "Excellent work! This student is close to completing the course." : student.progress >= 50 ? "Good progress. Keep encouraging consistent learning." : "There is room to grow. A little progress every day adds up."}</p><div className="detail-status"><span>Status</span><StatusBadge status={student.status} /></div><button className="button button-danger button-full" onClick={() => { if (window.confirm(`Delete ${student.name}?`)) { onDelete(student.id); navigate("/students"); } }}>Delete student</button></section></div>
    </>
  );
}

function InfoRow({ label, value }) {
  return <div className="info-row"><span>{label}</span><strong>{value}</strong></div>;
}

function CoursesPage({ students }) {
  const navigate = useNavigate();
  return (
    <>
      <div className="page-intro"><div><h2>Courses</h2><p>Explore the courses represented in your student community.</p></div><button className="button button-secondary" onClick={() => navigate("/students")}>View all students →</button></div>
      <div className="courses-grid">{courses.map((course, index) => { const members = students.filter((student) => student.course === course); const average = members.length ? Math.round(members.reduce((sum, student) => sum + student.progress, 0) / members.length) : 0; return <article className="panel course-card" key={course}><div className={`course-card-icon course-icon-${index % 4}`}>{["⌘", "◈", "▣", "◇", "✦"][index]}</div><span className="course-card-label">COURSE {String(index + 1).padStart(2, "0")}</span><h3>{course}</h3><p>{members.length ? `${members.length} enrolled ${members.length === 1 ? "student" : "students"}` : "No students enrolled yet"}</p><div className="course-card-progress"><div className="course-stat-top"><span>Average progress</span><strong>{average}%</strong></div><div className="progress-track"><span style={{ width: `${average}%` }} /></div></div><button className="text-button" onClick={() => navigate("/students")}>View student list <span>→</span></button></article>; })}</div>
    </>
  );
}

function SettingsPage({ settings, setSettings, onReset }) {
  const [resetConfirm, setResetConfirm] = useState(false);
  return (
    <>
      <div className="page-intro"><div><h2>Settings</h2><p>Customise your dashboard experience.</p></div></div>
      <div className="settings-layout"><section className="panel settings-panel"><div className="panel-heading"><div><h2>Appearance</h2><p>Adjust how student information is displayed.</p></div></div><div className="setting-row"><div><strong>Compact student table</strong><p>Reduce row spacing to display more students at once.</p></div><label className="switch"><input type="checkbox" checked={settings.compactTable} onChange={(event) => setSettings((current) => ({ ...current, compactTable: event.target.checked }))} /><span className="switch-slider" /></label></div></section><section className="panel settings-panel"><div className="panel-heading"><div><h2>Data management</h2><p>Your records are saved locally in this browser.</p></div></div><div className="setting-row"><div><strong>Reset sample data</strong><p>Restore the original demo student records. This replaces your current browser data.</p></div><button className="button button-danger" onClick={() => setResetConfirm(true)}>Reset data</button></div><div className="storage-notice"><span>ⓘ</span><p><strong>Local storage only</strong><br />This demo doesn't send student data to a server. Data is specific to this browser and device.</p></div></section></div>
      {resetConfirm && <Modal title="Reset all student data?" subtitle="Your current student records will be replaced." onClose={() => setResetConfirm(false)}><div className="delete-confirm"><p>This restores the original sample students and removes the changes you've made in this browser.</p><div className="form-actions"><button className="button button-secondary" onClick={() => setResetConfirm(false)}>Cancel</button><button className="button button-danger" onClick={() => { onReset(); setResetConfirm(false); }}>Restore sample data</button></div></div></Modal>}
    </>
  );
}

function NotFound() {
  return <section className="panel not-found"><div className="empty-icon">404</div><h2>Page not found</h2><p>The page you're looking for doesn't exist.</p><Link className="button button-primary" to="/">Return to dashboard</Link></section>;
}

export default function App() {
  const [students, setStudents] = useState(readStudents);
  const [settings, setSettingsState] = useState(readSettings);
  const [modalMode, setModalMode] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [toast, setToast] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(students));
  }, [students]);

  useEffect(() => {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 2800);
    return () => window.clearTimeout(timer);
  }, [toast]);

  function openAdd() {
    setEditingStudent(null);
    setModalMode("add");
  }

  function openEdit(student) {
    setEditingStudent(student);
    setModalMode("edit");
  }

  function saveStudent(form) {
    if (modalMode === "edit" && editingStudent) {
      setStudents((current) => current.map((student) => student.id === editingStudent.id ? { ...form, id: editingStudent.id } : student));
      setToast("Student details updated successfully.");
    } else {
      const newStudent = { ...form, id: Date.now() };
      setStudents((current) => [newStudent, ...current]);
      setToast("Student added successfully.");
    }
    setModalMode(null);
    setEditingStudent(null);
  }

  function deleteStudent(id) {
    setStudents((current) => current.filter((student) => student.id !== id));
    setToast("Student deleted.");
  }

  function setSettings(update) {
    setSettingsState((current) => typeof update === "function" ? update(current) : update);
  }

  function resetData() {
    setStudents(initialStudents);
    setToast("Sample data restored.");
  }

  const pageInfo = [
    { path: "/", title: "Overview", eyebrow: "MONDAY MOTIVATION" },
    { path: "/students", title: "Students", eyebrow: "YOUR COMMUNITY" },
    { path: "/courses", title: "Courses", eyebrow: "LEARNING PATHS" },
    { path: "/settings", title: "Settings", eyebrow: "PREFERENCES" }
  ];
  const currentInfo = pageInfo.find((page) => page.path === window.location.pathname) || { title: "Student details", eyebrow: "STUDENT PROFILE" };

  return (
    <div className="app-shell">
      <Sidebar onAdd={openAdd} />
      <main className="main-area">
        <Topbar title={currentInfo.title} eyebrow={currentInfo.eyebrow} onAdd={openAdd} />
        <div className="page-content">
          <Routes>
            <Route path="/" element={<Dashboard students={students} onAdd={openAdd} onViewAll={() => navigate("/students")} />} />
            <Route path="/students" element={<StudentsPage students={students} onAdd={openAdd} onEdit={openEdit} onDelete={deleteStudent} compactTable={settings.compactTable} />} />
            <Route path="/students/:id" element={<StudentDetails students={students} onEdit={openEdit} onDelete={deleteStudent} />} />
            <Route path="/courses" element={<CoursesPage students={students} />} />
            <Route path="/settings" element={<SettingsPage settings={settings} setSettings={setSettings} onReset={resetData} />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
          <footer className="app-footer"><span>© {new Date().getFullYear()} CampusFlow</span><span>Built with <strong>React</strong> · Made for learners <span className="footer-heart">♥</span></span></footer>
        </div>
      </main>
      {modalMode && <Modal title={modalMode === "edit" ? "Edit student" : "Register a student"} subtitle={modalMode === "edit" ? "Update this student's information below." : "Add a new learner to your community."} onClose={() => setModalMode(null)}><StudentForm initialValue={editingStudent} onSubmit={saveStudent} onCancel={() => setModalMode(null)} /></Modal>}
      {toast && <div className="toast" role="status"><span>✓</span>{toast}</div>}
    </div>
  );
}
