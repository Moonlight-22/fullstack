export default function AppFooter() {
  return (
    <footer className="border-t border-app surface px-6 py-4 md:px-10">
      <p className="text-xs text-muted">© {new Date().getFullYear()} Find Ace · Map data © OpenStreetMap</p>
    </footer>
  )
}
