export default function Card({children,classname=""}){
    return <div className={`bg-white rounded-2xl shadow-md ${classname}`}>{children}</div>
}