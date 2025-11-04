import { Users, BookOpen, GraduationCap, Star } from 'lucide-react';

const TutorStatsCard = ({ stats, loading = false, className = "" }) => {
    if (loading) {
        return (
            <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
                {[...Array(4)].map((_, index) => (
                    <div key={index} className="bg-gray-100 p-4 rounded-lg animate-pulse">
                        <div className="h-8 bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded"></div>
                    </div>
                ))}
            </div>
        );
    }

    const statsData = [
        {
            icon: Users,
            value: stats?.studentCount || 0,
            label: 'Students',
            color: 'blue',
            bgColor: 'bg-blue-50',
            textColor: 'text-blue-600'
        },
        {
            icon: BookOpen,
            value: stats?.totalCourses || 0,
            label: 'Courses',
            color: 'green',
            bgColor: 'bg-green-50',
            textColor: 'text-green-600'
        },
        {
            icon: GraduationCap,
            value: stats?.totalEnrollments || 0,
            label: 'Enrollments',
            color: 'purple',
            bgColor: 'bg-purple-50',
            textColor: 'text-purple-600'
        },
        {
            icon: Star,
            value: stats?.averageRating || '0.0',
            label: 'Rating',
            color: 'yellow',
            bgColor: 'bg-yellow-50',
            textColor: 'text-yellow-600'
        }
    ];

    return (
        <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 ${className}`}>
            {statsData.map((stat, index) => {
                const Icon = stat.icon;
                return (
                    <div key={index} className={`${stat.bgColor} p-4 rounded-lg text-center border border-opacity-20`}>
                        <div className="flex items-center justify-center mb-2">
                            <Icon className={`w-5 h-5 ${stat.textColor} mr-2`} />
                            <span className={`text-2xl font-bold ${stat.textColor}`}>
                                {stat.value}
                            </span>
                        </div>
                        <p className="text-sm text-gray-600">{stat.label}</p>
                    </div>
                );
            })}
        </div>
    );
};

export default TutorStatsCard;