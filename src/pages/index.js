import { HomeComponent } from '../../components/HomeComponent';
import { withAuth } from '../hoc/withAuth';

function Home({ user }) {
  return <HomeComponent user={user} />;
}

export default withAuth(Home); 