const team = [
  {
    name: "Rabbi [Name]",
    title: "Founder & Executive Director",
    bio: "Rabbi [Name] founded Tomchei Shabbos of Florida with a simple belief: no family in our community should go without a Shabbos meal. His vision and dedication have guided the organization from its humble beginnings to where it stands today.",
    photo: "/photos/photo-4.jpg",
  },
  {
    name: "[Name]",
    title: "Director of Operations",
    bio: "[Name] oversees the day-to-day operations of Tomchei Shabbos, coordinating volunteers, suppliers, and deliveries to ensure every family receives their package before Shabbos.",
    photo: "/photos/photo-5.jpg",
  },
  {
    name: "[Name]",
    title: "Volunteer Coordinator",
    bio: "[Name] manages our incredible volunteer network, scheduling and supporting the hundreds of community members who give their time each week to make Shabbos possible for families in need.",
    photo: "/photos/photo-6.jpg",
  },
  {
    name: "[Name]",
    title: "Community Outreach",
    bio: "[Name] connects Tomchei Shabbos with families, donors, and community partners across South Florida, building the relationships that allow us to grow and serve more people every year.",
    photo: "/photos/photo-7.jpg",
  },
];

import Image from "next/image";

export default function TeamSection() {
  return (
    <section className="bg-[#FDF9F7] py-24">
      <div className="max-w-6xl mx-auto px-6">
        <div className="text-center mb-14">
          <span className="text-[#F5A020] font-semibold text-xs uppercase tracking-widest">The People Behind It All</span>
          <h2 className="font-playfair text-4xl font-bold text-gray-900 mt-3 mb-4">Meet Our Team</h2>
          <p className="text-gray-500 text-lg max-w-xl mx-auto">
            Dedicated individuals who show up every week because they believe in the power of community.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {team.map((member) => (
            <div key={member.name} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="relative h-56">
                <Image src={member.photo} alt={member.name} fill className="object-cover" />
              </div>
              <div className="p-6">
                <h3 className="font-playfair font-bold text-gray-900 text-lg mb-1">{member.name}</h3>
                <p className="text-[#F5A020] text-xs font-semibold uppercase tracking-wide mb-3">{member.title}</p>
                <p className="text-gray-500 text-sm leading-relaxed">{member.bio}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

