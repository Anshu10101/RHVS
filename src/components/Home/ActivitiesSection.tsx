import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CalendarDays, HandHeart, GraduationCap, UsersRound, Megaphone, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

const items = [
  {
    icon: <HandHeart className="h-6 w-6" />, title: 'सेवा अभियान (Seva Drives)',
    desc: 'रक्तदान, अन्नदान, वस्त्रदान और आपदा राहत के माध्यम से समाज सेवा।'
  },
  {
    icon: <GraduationCap className="h-6 w-6" />, title: 'शिक्षा एवं संस्कार',
    desc: 'संस्कृत/गीतापाठ, बाल संस्कार केंद्र, और छात्र मार्गदर्शन सत्र।'
  },
  {
    icon: <UsersRound className="h-6 w-6" />, title: 'समाज एकता कार्यक्रम',
    desc: 'सामुदायिक बैठकें, भजन संध्या और सांस्कृतिक उत्सवों द्वारा एकता।'
  },
  {
    icon: <Megaphone className="h-6 w-6" />, title: 'जागरूकता अभियान',
    desc: 'स्वच्छता, पर्यावरण, और नशामुक्ति जैसे विषयों पर जनजागरण।'
  },
  {
    icon: <BookOpen className="h-6 w-6" />, title: 'धार्मिक अध्ययन',
    desc: 'वेद-पुराण, रामायण, गीता अध्ययन मंडलियों का आयोजन।'
  },
  {
    icon: <CalendarDays className="h-6 w-6" />, title: 'विशेष आयोजन',
    desc: 'त्योहार सेवा, शोभा यात्राएँ, और युवा सम्मेलन।'
  },
];

export default function ActivitiesSection() {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h3 className="uppercase font-bold mb-2 text-orange-700">Activities</h3>
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-orange-900">हमारी प्रमुख गतिविधियाँ</h2>
          <p className="max-w-2xl mx-auto text-gray-700">सनातन मूल्यों पर आधारित सामाजिक सेवा, शिक्षा, और सांस्कृतिक समन्वय के प्रयास।</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((it, idx) => (
            <Card key={idx} className="rounded-2xl border-orange-100 hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100 text-orange-700">
                  {it.icon}
                </div>
                <CardTitle className="mt-3 text-xl text-orange-900">{it.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700 leading-7">{it.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-10 text-center">
          <Button className="rounded-full px-6 bg-orange-600 hover:bg-orange-700">सभी गतिविधियाँ देखें</Button>
        </div>
      </div>
    </section>
  );
}


