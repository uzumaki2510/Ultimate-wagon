import { Link, useParams } from 'react-router-dom';
import { workshopLines } from '@/lib/navigation';
import WorkshopOverview from './WorkshopOverview';
export default function WorkshopLine() {
  const { lineId } = useParams();
  return workshopLines.some(line => line.id === lineId) ? <WorkshopOverview key={lineId} fixedLine={lineId} /> : <div><h1>Workshop line not found</h1><Link to="/workshop">Back to workshop</Link></div>;
}
