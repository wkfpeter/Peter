import { use, useEffect, useState } from "react";
import axios from "axios";
import {
  Container,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  IconButton,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  TextField,
  Button,
} from "@mui/material";
import Navbar from "../components/Navbar";
import ThumbUpOffAltIcon from "@mui/icons-material/ThumbUpOffAlt";
import ThumbUpAltIcon from "@mui/icons-material/ThumbUpAlt";
import { toast } from "react-toastify";

const EventPage = () => {
  const [events, setEvents] = useState([]);
  const [likedEvents, setLikedEvents] = useState({});
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [filterLiked, setFilterLiked] = useState("all");
  const [filterPrice, setFilterPrice] = useState(0);
  const [bookedEvents, setBookedEvents] = useState({});
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const fetchData = async () => {
    try {
      const [locationsResponse, eventsResponse] = await Promise.all([
        axios.get("http://localhost:3000/locations"),
        axios.get("http://localhost:3000/events"),
      ]);

      const locations = locationsResponse.data;
      const events = eventsResponse.data;
      const updatedEvents = events.map((event) => ({
        ...event,
        venue: locations.find((location) => location._id === event.venue).name,
      }));
      setEvents(updatedEvents);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLikedEvents = async () => {
    try {
      const response = await axios.get("http://localhost:3000/likes/events", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      const likedEvents = response.data.reduce((acc, event) => {
        acc[event._id] = true;
        return acc;
      }, {});
      setLikedEvents(likedEvents);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchBookedEvents = async () => {
    try {
      const response = await axios.get(
        "http://localhost:3000/bookings/events",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      const bookedEvents = response.data.reduce((acc, event) => {
        acc[event._id] = true;
        return acc;
      }, {});
      setBookedEvents(bookedEvents);
    } catch (err) {
      console.error(err);
    }
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleLike = async (eventId) => {
    try {
      const isLiked = likedEvents[eventId];
      const updatedLikedEvents = { ...likedEvents, [eventId]: !isLiked };
      setLikedEvents(updatedLikedEvents);

      await axios.post(
        `http://localhost:3000/likes/${eventId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleBook = async (eventId) => {
    try {
      const isBooked = bookedEvents[eventId];
      const updatedBookedEvents = { ...bookedEvents, [eventId]: !isBooked };
      setBookedEvents(updatedBookedEvents);

      await axios.post(
        `http://localhost:3000/bookings/${eventId}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
      );
      toast.success(
        isBooked
          ? "Booking canceled successfully!"
          : "Event booked successfully!"
      );
    } catch (err) {
      toast.error("Failed to book the event. Please try again.");
      console.error(err);
    }
  };

  useEffect(() => {
    let filtered = events;

    if (filterLiked === "liked") {
      filtered = filtered.filter((event) => likedEvents[event._id]);
    } else if (filterLiked === "booked") {
      filtered = filtered.filter((event) => bookedEvents[event._id]);
    }

    if (filterPrice) {
      filtered = filtered.filter((event) => {
        const prices =
          event.price
            ?.match(/\$\d+/g)
            ?.map((price) => parseFloat(price.replace("$", ""))) || [];
        const minPrice = prices.length > 0 ? Math.min(...prices) : Infinity;

        return (
          minPrice <= filterPrice || event.price.includes("Free admission.")
        );
      });
    }

    setFilteredEvents(filtered);
  }, [filterLiked, filterPrice, events, likedEvents, bookedEvents]);

  useEffect(() => {
    fetchData();
    fetchLikedEvents();
    fetchBookedEvents();
  }, []);

  return (
    <div style={{ backgroundColor: "#F5F5F5" }}>
      <Navbar />

      <Container>
        <div className="mt-10">
          <div className="flex flex-row gap-5 mb-5">
            <FormControl fullWidth margin="normal">
              <InputLabel>Filter by Events</InputLabel>
              <Select
                value={filterLiked}
                onChange={(e) => setFilterLiked(e.target.value)}
                label="Filter by Liked Events"
              >
                <MenuItem value="all">All Events</MenuItem>
                <MenuItem value="liked">Liked Events</MenuItem>
                <MenuItem value="booked">Booked Events</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth margin="normal">
              <TextField
                label="Filter by Price (under)"
                type="number"
                value={filterPrice}
                onChange={(e) => setFilterPrice(e.target.value)}
                variant="outlined"
                fullWidth
              />
            </FormControl>
          </div>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>Title</TableCell>
                  <TableCell>Venue</TableCell>
                  <TableCell>Description</TableCell>
                  <TableCell>Date/Time</TableCell>
                  <TableCell>Presenter</TableCell>
                  <TableCell>Price</TableCell>
                  <TableCell>Like</TableCell>
                  <TableCell>Book</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredEvents
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((event) => (
                    <TableRow key={event._id}>
                      <TableCell>{event.eventId}</TableCell>
                      <TableCell>{event.title}</TableCell>
                      <TableCell>{event.venue}</TableCell>
                      <TableCell>{event.description}</TableCell>
                      <TableCell>{event.dateTime}</TableCell>
                      <TableCell>
                        {event.presenter.split("Presented by")[1]}
                      </TableCell>
                      <TableCell>{event.price}</TableCell>
                      <TableCell>
                        <IconButton onClick={() => handleLike(event._id)}>
                          {likedEvents[event._id] ? (
                            <ThumbUpAltIcon />
                          ) : (
                            <ThumbUpOffAltIcon />
                          )}
                        </IconButton>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="contained"
                          color="warning"
                          sx={{
                            textTransform: "none",
                          }}
                          onClick={() => handleBook(event._id)}
                        >
                          {bookedEvents[event._id] ? "Cancel" : "Book"}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25]}
              component="div"
              count={events.length}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
            />
          </TableContainer>
        </div>
      </Container>
    </div>
  );
};

export default EventPage;
