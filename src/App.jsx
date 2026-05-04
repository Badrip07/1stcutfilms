import React from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Home from './Pages/Home/Home'
import About from './Pages/About/About'
import Career from './Pages/Career/Career'
import SingleJob from './Pages/Career/SingleJob'
import Contact from './Pages/Contact/Contact'
import Work from './Pages/Work/Work'
import SinglePost from './Pages/Work/SinglePost'
import PrivacyPolicy from './Pages/PrivacyPolicy/PrivacyPolicy'

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/work" element={<Work />} />
        <Route path="/work/:id" element={<SinglePost />} />
        <Route path="/about" element={<About />} />
        <Route path="/career" element={<Career />} />
        <Route path="/career/:id" element={<SingleJob />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      </Routes>
    </Router>
  )
}

export default App
