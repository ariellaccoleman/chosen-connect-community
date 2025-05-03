
import { Button } from "@/components/ui/button";

const CallToAction = () => {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-gradient-to-br from-chosen-blue via-chosen-navy to-chosen-navy rounded-2xl shadow-xl overflow-hidden">
          <div className="px-6 py-12 md:p-12 text-center text-white">
            <h2 className="text-3xl md:text-4xl font-bold font-heading mb-4">
              Ready to Join the Chosen Network?
            </h2>
            <p className="text-xl mb-8 max-w-2xl mx-auto">
              Connect with professionals who share your values and expand your career opportunities.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button className="btn-secondary" size="lg">
                Create Account
              </Button>
              <Button variant="outline" className="border-white text-white hover:bg-white hover:text-chosen-navy" size="lg">
                Request Demo
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CallToAction;
