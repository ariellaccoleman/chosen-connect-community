
const stats = [
  { value: "10,000+", label: "Members" },
  { value: "500+", label: "Companies" },
  { value: "50+", label: "Countries" },
  { value: "2,500+", label: "Job Opportunities" }
];

const StatsSection = () => {
  return (
    <section className="py-16 bg-chosen-navy text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <p className="text-4xl md:text-5xl font-bold font-heading text-chosen-gold mb-2">
                {stat.value}
              </p>
              <p className="text-lg text-gray-300">
                {stat.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
