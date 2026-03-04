export default function SiteFooter() {
  return (
    <footer className="border-t border-[#1e1e3f] bg-[#050510]/95 backdrop-blur-sm py-8 px-4 text-center text-sm text-gray-400">
      <div className="max-w-7xl mx-auto space-y-2">
        <p className="text-gray-200 font-semibold">Engineering Department | Institute of Engineering and Technology | Deen Dayal Upadhyaya Gorakhpur University, Gorakhpur</p>
        <p>
          Organized by <span className="text-white">Ignite Team</span> | Tech Team: <span className="text-[#00f5ff]">Team Paradox</span>
        </p>
        <p>
          Developer Contact: <a href="mailto:aditya@teamparadox.in" className="text-[#ff2d78] hover:underline">aditya@teamparadox.in</a> | Support: <a href="mailto:support@teamparadox.in" className="text-[#ff2d78] hover:underline">support@teamparadox.in</a>
        </p>
        <p>
          Feedback: <a href="mailto:support@teamparadox.in?subject=Ignite%2026%20Feedback" className="text-[#00f5ff] hover:underline">Send feedback</a>
          {' '}| For any issue include your roll number and screenshot for faster support.
        </p>
        <p className="text-xs text-gray-500">&copy; 2026 Ignite'26. All rights reserved.</p>
      </div>
    </footer>
  );
}
