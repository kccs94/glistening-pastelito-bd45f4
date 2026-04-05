import { AppSettings } from './shared';

const today = todayStr()
const [weekStart, setWeekStart] = useState(() => getMondayOfWeek(new Date()))
const weekDates = getWeekDates(weekStart)
const settings = store.get<AppSettings>('bz_settings', DEFAULT_SETTINGS)
const staffList = settings.staffList[viewOutlet]