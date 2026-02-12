import Link from "next/link";
import Image from "next/image";

export function Navbar() {
  return (
    <nav className="bg-brand-navy sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-2xl font-bold text-white">
              <Image src="/assets/Logo.png" alt="Logo" width={70} height={70}/>
            </Link>
          </div>

          <div className="flex gap-8">
            <Link href="/" className="text-white hover:text-gray-200">
              Home
            </Link>
            <Link href="/about" className="text-white hover:text-gray-200">
              About
            </Link>
            <Link href="/contact" className="text-white hover:text-gray-200">
              Contact
            </Link>
            <Link href="/itemsearch" className="text-white hover:text-gray-200">
              Test Items
            </Link>
            <Link href="/forms" className="text-white hover:text-gray-200">
              Test Forms
            </Link>
            <Link href="/login" className="text-white hover:text-gray-200">
              Test Login
            </Link>
          </div>

          <div>
            <Link
              href="/schoolfind"
              className="bg-white text-black px-4 py-2 rounded-lg hover:bg-gray-200"
            >
              Find Your School
            </Link>
            <Link
              href="/signupschool"
              className="bg-white text-black px-4 py-2 ml-10 rounded-lg hover:bg-gray-200"
            >
              Sign Up Your School
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
