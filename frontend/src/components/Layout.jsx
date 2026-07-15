import Header from './Header';
export default function Layout({ children }) {
  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] text-[#1C2B22] selection:bg-[#004F30]/20">
      <Header />
      <main className="flex-grow">
        {children}
      </main>
    </div>
  );
}
